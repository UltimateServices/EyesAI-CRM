import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { companyId, romaData } = await request.json();

    if (!companyId || !romaData) {
      return NextResponse.json(
        { error: 'Company ID and ROMA data are required' },
        { status: 400 }
      );
    }

    // Validate that romaData is an object
    if (typeof romaData !== 'object' || Array.isArray(romaData)) {
      return NextResponse.json(
        { error: 'Invalid ROMA data format - must be a JSON object' },
        { status: 400 }
      );
    }

    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify company exists and belongs to user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, name, organization_id')
      .eq('id', companyId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    // Check if intake already exists
    const { data: existingIntake } = await supabase
      .from('intakes')
      .select('id')
      .eq('company_id', companyId)
      .single();

    let result;
    if (existingIntake) {
      // Update existing intake
      const { data, error } = await supabase
        .from('intakes')
        .update({
          roma_data: romaData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntake.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating intake:', error);
        return NextResponse.json(
          { error: 'Failed to update intake data', details: error.message },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new intake
      const { data, error } = await supabase
        .from('intakes')
        .insert({
          company_id: companyId,
          roma_data: romaData,
          organization_id: membership.organization_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating intake:', error);
        return NextResponse.json(
          { error: 'Failed to save intake data', details: error.message },
          { status: 500 }
        );
      }
      result = data;
    }

    // Update companies table with data from romaData
    console.log('Updating companies table for:', companyId);
    const companyUpdate: any = {};

    if (romaData.hero) {
      companyUpdate.name = romaData.hero.business_name || companyUpdate.name;
      companyUpdate.tagline = romaData.hero.tagline;
      companyUpdate.logo_url = romaData.hero.hero_image_url || romaData.hero.logo_url;

      if (romaData.hero.quick_actions) {
        companyUpdate.phone = romaData.hero.quick_actions.call_tel?.replace('tel:', '');
        companyUpdate.website = romaData.hero.quick_actions.website_url;
        companyUpdate.email = romaData.hero.quick_actions.email_mailto?.replace('mailto:', '');
        companyUpdate.google_maps_url = romaData.hero.quick_actions.maps_link;
      }
    }

    if (romaData.about_and_badges) {
      companyUpdate.about = romaData.about_and_badges.about_text || romaData.about_and_badges.ai_summary_120w;
      companyUpdate.ai_summary = romaData.about_and_badges.ai_summary_120w;
    }

    if (romaData.locations_and_hours?.primary_location) {
      const loc = romaData.locations_and_hours.primary_location;
      companyUpdate.address = loc.street_address;
      companyUpdate.city = loc.city;
      companyUpdate.state = loc.state;
      companyUpdate.zip = loc.zip;
    }

    // Remove undefined values
    Object.keys(companyUpdate).forEach(key => {
      if (companyUpdate[key] === undefined) delete companyUpdate[key];
    });

    if (Object.keys(companyUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('companies')
        .update(companyUpdate)
        .eq('id', companyId);

      if (updateError) {
        console.error('Error updating company:', updateError);
      }
    }

    // Extract and save reviews from ROMA data
    let reviewsCount = 0;
    try {
      let reviewsArray: any[] = [];

      // Handle object format: {review_1: {...}, review_2: {...}}
      if (romaData.featured_reviews && typeof romaData.featured_reviews === 'object') {
        // Extract review_1 through review_5
        for (let i = 1; i <= 5; i++) {
          const review = romaData.featured_reviews[`review_${i}`];
          if (review && review.reviewer && review.excerpt) {
            reviewsArray.push(review);
          }
        }
      }

      // Also handle array format for backward compatibility
      const featuredReviewsItems = romaData.featured_reviews?.items || [];
      if (Array.isArray(featuredReviewsItems)) {
        reviewsArray = reviewsArray.concat(featuredReviewsItems);
      }

      if (reviewsArray.length > 0) {
        // Delete existing reviews for this company to avoid duplicates
        await supabase
          .from('reviews')
          .delete()
          .eq('company_id', companyId);

        const reviewsToInsert = reviewsArray.map((review: any) => ({
          company_id: companyId,
          organization_id: membership.organization_id,
          platform: review.source || review.platform || 'Google',
          author: review.reviewer || review.author || review.author_name || review.reviewer_name || 'Anonymous',
          rating: review.stars || review.rating || 5,
          text: review.excerpt || review.text || review.review_text || review.comment || '',
          date: review.date || review.review_date || review.time_description || new Date().toISOString(),
          url: review.url || review.review_url || null,
        }));

        const { data: insertedReviews, error: reviewsError } = await supabase
          .from('reviews')
          .insert(reviewsToInsert)
          .select();

        if (reviewsError) {
          console.error('Error saving reviews:', reviewsError);
        } else {
          reviewsCount = insertedReviews?.length || 0;
          console.log(`✅ Saved ${reviewsCount} reviews to database`);
        }
      }
    } catch (err) {
      console.error('Error extracting reviews:', err);
    }

    // Helper function to download and upload image to Supabase Storage
    const downloadAndUploadImage = async (imageUrl: string, fileName: string, companyId: string) => {
      try {
        // Try direct download first with browser-like headers
        let imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': new URL(imageUrl).origin,
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });

        // If direct download fails (403/blocked), try using image proxy
        if (!imageResponse.ok) {
          console.log(`Direct download failed (${imageResponse.status}), trying proxy: ${imageUrl}`);
          // Remove protocol for weserv proxy (it expects domain.com/path, not https://domain.com/path)
          const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, '');
          const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(urlWithoutProtocol)}`;
          imageResponse = await fetch(proxyUrl);

          if (!imageResponse.ok) {
            console.error(`Proxy download also failed (${imageResponse.status}): ${imageUrl}`);
            return imageUrl; // Return original URL if both methods fail
          }
          console.log(`✅ Downloaded via proxy: ${imageUrl}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);

        // Upload to Supabase Storage
        const storagePath = `${companyId}/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, buffer, {
            contentType: imageResponse.headers.get('content-type') || 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return imageUrl; // Return original URL if upload fails
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(storagePath);

        console.log(`✅ Uploaded image: ${fileName} -> ${publicUrl}`);
        return publicUrl;
      } catch (err) {
        console.error(`Error processing image ${imageUrl}:`, err);
        return imageUrl; // Return original URL on error
      }
    };

    // Extract and save media items from ROMA data
    let mediaCount = 0;
    try {
      const mediaItems: any[] = [];

      // Extract logo from hero section
      const logoUrl = romaData.hero?.company_logo || romaData.hero?.hero_image_url || romaData.hero?.logo_url || romaData.hero?.image;
      if (logoUrl && logoUrl !== '<>') {
        const fileName = `logo-${Date.now()}.jpg`;
        const uploadedUrl = await downloadAndUploadImage(logoUrl, fileName, companyId);

        mediaItems.push({
          company_id: companyId,
          organization_id: membership.organization_id,
          file_name: fileName,
          file_url: uploadedUrl,
          file_type: 'image',
          file_size: 0,
          mime_type: 'image/jpeg',
          category: 'logo',
          internal_tags: ['logo'],
          uploaded_by_type: 'worker',
          uploaded_by_id: user.id,
          priority: 100,
          status: 'pending', // VA must categorize in Step 4 to activate
        });
      }

      // Handle object format: {image_1: {url, alt}, image_2: {url, alt}}
      if (romaData.photo_gallery && typeof romaData.photo_gallery === 'object') {
        for (let i = 1; i <= 5; i++) {
          const image = romaData.photo_gallery[`image_${i}`];
          const imageUrl = image?.url;
          const imageAlt = image?.alt;

          if (imageUrl && imageUrl !== '<>') {
            const fileName = `gallery-${i}-${Date.now()}.jpg`;
            const uploadedUrl = await downloadAndUploadImage(imageUrl, fileName, companyId);

            mediaItems.push({
              company_id: companyId,
              organization_id: membership.organization_id,
              file_name: fileName,
              file_url: uploadedUrl,
              file_type: 'image',
              file_size: 0,
              mime_type: 'image/jpeg',
              category: 'photo',
              internal_tags: imageAlt ? [imageAlt.toLowerCase()] : ['business-exterior'],
              uploaded_by_type: 'worker',
              uploaded_by_id: user.id,
              priority: i,
              status: 'pending', // VA must categorize in Step 4 to activate
            });
          }
        }
      }

      // Also handle array format for backward compatibility
      const galleryImages = romaData.photo_gallery?.images || [];
      if (Array.isArray(galleryImages)) {
        let imageIndex = 0;
        for (const image of galleryImages) {
          const imageUrl = typeof image === 'string' ? image : (image.url || image.image_url || image.src);
          if (imageUrl && imageUrl !== '<>') {
            const fileName = `gallery-array-${imageIndex}-${Date.now()}.jpg`;
            const uploadedUrl = await downloadAndUploadImage(imageUrl, fileName, companyId);

            mediaItems.push({
              company_id: companyId,
              organization_id: membership.organization_id,
              file_name: fileName,
              file_url: uploadedUrl,
              file_type: 'image',
              file_size: 0,
              mime_type: 'image/jpeg',
              category: 'photo',
              internal_tags: ['business-exterior'],
              uploaded_by_type: 'worker',
              uploaded_by_id: user.id,
              priority: imageIndex + 10,
              status: 'pending', // VA must categorize in Step 4 to activate
            });
            imageIndex++;
          }
        }
      }

      if (mediaItems.length > 0) {
        // Delete existing media for this company to avoid duplicates
        await supabase
          .from('media_items')
          .delete()
          .eq('company_id', companyId);

        const { data: insertedMedia, error: mediaError } = await supabase
          .from('media_items')
          .insert(mediaItems)
          .select();

        if (mediaError) {
          console.error('Error saving media items:', mediaError);
        } else {
          mediaCount = insertedMedia?.length || 0;
          console.log(`✅ Saved ${mediaCount} media items to database`);
        }
      }
    } catch (err) {
      console.error('Error extracting media:', err);
    }

    // Mark Step 2 as complete
    const { error: stepError } = await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .eq('step_number', 2);

    if (stepError) {
      console.error('Error completing step 2:', stepError);
      // Don't fail the request, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Intake data saved and migrated successfully',
      intake: result,
      extracted: {
        reviews: reviewsCount,
        media: mediaCount,
      },
    });

  } catch (error) {
    console.error('Paste intake error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save intake',
        details: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
