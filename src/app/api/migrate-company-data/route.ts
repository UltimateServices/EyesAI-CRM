import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// POST /api/migrate-company-data - Migrate company data to intake table with Webflow-aligned columns
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get or create intake record
    let { data: intake, error: intakeError } = await supabase
      .from('intakes')
      .select('*')
      .eq('company_id', companyId)
      .single();

    // If no intake exists, create one
    if (intakeError || !intake) {
      const { data: newIntake, error: createError } = await supabase
        .from('intakes')
        .insert({
          company_id: companyId,
          business_name: company.name,
          status: 'pending',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating intake:', createError);
        return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 });
      }

      intake = newIntake;
    }

    // Prepare migration data - map from companies table to intake Webflow-aligned columns
    const migrationData: any = {
      business_name: company.name,
      display_name: company.name,
      website: company.website,
      phone: company.phone,
      email: company.email,
      address: company.address,
      city: company.city,
      state: company.state,
      zip: company.zip,
      tagline: company.tagline,
      about: company.about || company.description,
      ai_summary: company.ai_summary,
      logo_url: company.logo_url,
      facebook_url: company.facebook_url,
      instagram_url: company.instagram_url,
      youtube_url: company.youtube_url,
      google_maps_url: company.google_maps_url,
      yelp_url: company.yelp_url,
      pricing_info: company.pricing_info,
      package_type: company.plan === 'verified' ? 'verified' : 'discover',
      spotlight: company.spotlight || false,
      webflow_slug: company.webflow_slug,
    };

    // Extract data from roma_data if it exists
    if (intake.roma_data) {
      const romaData = intake.roma_data;

      // Extract from hero section
      if (romaData.hero) {
        migrationData.business_name = migrationData.business_name || romaData.hero.business_name || romaData.hero.company_name;
        migrationData.tagline = migrationData.tagline || romaData.hero.tagline;
        migrationData.logo_url = migrationData.logo_url || romaData.hero.logo_url;

        // Extract quick actions
        if (romaData.hero.quick_actions) {
          const qa = romaData.hero.quick_actions;
          migrationData.phone = migrationData.phone || qa.call_tel?.replace('tel:', '');
          migrationData.website = migrationData.website || qa.website_url;
          migrationData.email = migrationData.email || qa.email_mailto?.replace('mailto:', '');
          migrationData.google_maps_url = migrationData.google_maps_url || qa.directions_url;
        }
      }

      // Extract from about section
      if (romaData.about_and_badges) {
        migrationData.about = migrationData.about || romaData.about_and_badges.about_text;
        migrationData.ai_summary = migrationData.ai_summary || romaData.about_and_badges.ai_summary_120w;

        // Extract badges/tags
        if (romaData.about_and_badges.badges && Array.isArray(romaData.about_and_badges.badges)) {
          migrationData.tag1 = romaData.about_and_badges.badges[0];
          migrationData.tag2 = romaData.about_and_badges.badges[1];
          migrationData.tag3 = romaData.about_and_badges.badges[2];
          migrationData.tag4 = romaData.about_and_badges.badges[3];
        }
      }

      // Extract from ai_overview
      if (romaData.ai_overview) {
        migrationData.ai_summary = migrationData.ai_summary || romaData.ai_overview.overview_line;
      }

      // Extract from location section
      if (romaData.location_and_contact) {
        const loc = romaData.location_and_contact;
        migrationData.address = migrationData.address || loc.address;
        migrationData.city = migrationData.city || loc.city;
        migrationData.state = migrationData.state || loc.state;
        migrationData.zip = migrationData.zip || loc.zip;
        migrationData.phone = migrationData.phone || loc.phone;
        migrationData.email = migrationData.email || loc.email;
        migrationData.website = migrationData.website || loc.website;
      }

      // Extract social media
      if (romaData.social_media) {
        const social = romaData.social_media;
        migrationData.facebook_url = migrationData.facebook_url || social.facebook_url;
        migrationData.instagram_url = migrationData.instagram_url || social.instagram_url;
        migrationData.youtube_url = migrationData.youtube_url || social.youtube_url;
        migrationData.social_handle = social.instagram_handle || social.social_handle;
      }

      // Extract pricing
      if (romaData.pricing) {
        migrationData.pricing_info = migrationData.pricing_info || romaData.pricing.pricing_information;
      }
    }

    // Remove null/undefined values
    Object.keys(migrationData).forEach(key => {
      if (migrationData[key] === null || migrationData[key] === undefined) {
        delete migrationData[key];
      }
    });

    // Update intake with migrated data
    const { data: updatedIntake, error: updateError } = await supabase
      .from('intakes')
      .update(migrationData)
      .eq('id', intake.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating intake:', updateError);
      return NextResponse.json({ error: 'Failed to update intake' }, { status: 500 });
    }

    // ALSO update the companies table with the migrated data (source of truth for Webflow)
    const companyUpdate: any = {
      name: migrationData.business_name || company.name,
      website: migrationData.website,
      phone: migrationData.phone,
      email: migrationData.email,
      address: migrationData.address,
      city: migrationData.city,
      state: migrationData.state,
      zip: migrationData.zip,
      tagline: migrationData.tagline,
      about: migrationData.about,
      ai_summary: migrationData.ai_summary,
      logo_url: migrationData.logo_url,
      facebook_url: migrationData.facebook_url,
      instagram_url: migrationData.instagram_url,
      youtube_url: migrationData.youtube_url,
      google_maps_url: migrationData.google_maps_url,
      yelp_url: migrationData.yelp_url,
      pricing_info: migrationData.pricing_info,
      plan: migrationData.package_type === 'verified' ? 'verified' : 'discover',
      webflow_slug: migrationData.webflow_slug,
      updated_at: new Date().toISOString(),
    };

    // Remove null/undefined values
    Object.keys(companyUpdate).forEach(key => {
      if (companyUpdate[key] === null || companyUpdate[key] === undefined) {
        delete companyUpdate[key];
      }
    });

    const { error: companyUpdateError } = await supabase
      .from('companies')
      .update(companyUpdate)
      .eq('id', companyId);

    if (companyUpdateError) {
      console.error('Error updating company:', companyUpdateError);
      // Don't fail the whole migration if company update fails
    }

    // Extract and save images from roma_data to media_items
    let mediaCount = 0;
    const mediaErrors: string[] = [];

    // Extract and save reviews from roma_data to reviews table
    let reviewCount = 0;
    const reviewErrors: string[] = [];

    if (intake.roma_data) {
      const romaData = intake.roma_data;
      const imagesToSave: Array<{ url: string; category: string; internal_tags: string[] }> = [];

      // Extract logo
      if (romaData.hero?.logo_url) {
        imagesToSave.push({
          url: romaData.hero.logo_url,
          category: 'logo',
          internal_tags: ['Logo'],
        });
      }

      // Extract hero image as photo
      if (romaData.hero?.hero_image_url) {
        imagesToSave.push({
          url: romaData.hero.hero_image_url,
          category: 'photo',
          internal_tags: ['Business Exterior', 'Featured'],
        });
      }

      // Extract photos from gallery
      if (romaData.photos && Array.isArray(romaData.photos)) {
        romaData.photos.forEach((photo: any) => {
          if (photo.url || photo.image_url) {
            imagesToSave.push({
              url: photo.url || photo.image_url,
              category: 'photo',
              internal_tags: photo.tags || ['Uncategorized'],
            });
          }
        });
      }

      // Extract from photo_gallery.images (ROMA structure)
      if (romaData.photo_gallery?.images && Array.isArray(romaData.photo_gallery.images)) {
        romaData.photo_gallery.images.forEach((photo: any) => {
          if (photo.url || photo.image_url || photo.src) {
            imagesToSave.push({
              url: photo.url || photo.image_url || photo.src,
              category: 'photo',
              internal_tags: photo.alt_text ? ['Business Exterior'] : ['Uncategorized'],
            });
          }
        });
      }

      // Extract from photo_gallery if different structure
      if (romaData.photo_gallery && Array.isArray(romaData.photo_gallery)) {
        romaData.photo_gallery.forEach((photo: any) => {
          if (photo.url || photo.src) {
            imagesToSave.push({
              url: photo.url || photo.src,
              category: 'photo',
              internal_tags: ['Business Exterior'],
            });
          }
        });
      }

      // Save each image to media_items (only if not already saved)
      for (const image of imagesToSave) {
        try {
          // Check if this URL already exists for this company
          const { data: existing } = await supabase
            .from('media_items')
            .select('id')
            .eq('company_id', companyId)
            .eq('file_url', image.url)
            .single();

          if (existing) {
            continue; // Skip if already exists
          }

          // Extract filename from URL
          const urlParts = image.url.split('/');
          const fileName = urlParts[urlParts.length - 1] || 'image.jpg';

          // Determine file type from extension
          const extension = fileName.split('.').pop()?.toLowerCase();
          const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(extension || '');
          const fileType = isVideo ? 'video' : 'image';

          // Insert media item
          const { error: mediaError } = await supabase
            .from('media_items')
            .insert({
              company_id: companyId,
              organization_id: company.organization_id,
              file_name: fileName,
              file_url: image.url,
              file_type: fileType,
              file_size: 0, // Unknown size for external URLs
              mime_type: isVideo ? 'video/mp4' : 'image/jpeg',
              category: image.category as 'logo' | 'photo' | 'video',
              internal_tags: image.internal_tags,
              uploaded_by_type: 'client',
              uploaded_by_id: user.id,
              priority: image.category === 'logo' ? 100 : 0, // Logos get highest priority
              status: 'active', // Auto-mark intake images as active
            });

          if (mediaError) {
            console.error('Error saving media item:', mediaError);
            mediaErrors.push(`Failed to save ${fileName}: ${mediaError.message}`);
          } else {
            mediaCount++;
          }
        } catch (error) {
          console.error('Error processing image:', error);
          mediaErrors.push(`Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Extract reviews from roma_data
      const reviewsToSave: Array<{
        author: string;
        rating: number;
        text: string;
        date: string;
        platform: string;
        url?: string;
      }> = [];

      // Extract from reviews section
      if (romaData.reviews && Array.isArray(romaData.reviews)) {
        romaData.reviews.forEach((review: any) => {
          if (review.text || review.review_text || review.content) {
            reviewsToSave.push({
              author: review.author || review.reviewer_name || review.name || 'Anonymous',
              rating: review.rating || review.stars || 5,
              text: review.text || review.review_text || review.content,
              date: review.date || review.review_date || review.created_at || new Date().toISOString(),
              platform: review.platform || review.source || 'Google',
              url: review.url || review.review_url,
            });
          }
        });
      }

      // Extract from google_reviews if separate
      if (romaData.google_reviews && Array.isArray(romaData.google_reviews)) {
        romaData.google_reviews.forEach((review: any) => {
          if (review.text || review.snippet) {
            reviewsToSave.push({
              author: review.author_name || review.reviewer || 'Anonymous',
              rating: review.rating || 5,
              text: review.text || review.snippet,
              date: review.time || review.date || new Date().toISOString(),
              platform: 'Google',
              url: review.author_url || review.link,
            });
          }
        });
      }

      // Extract from testimonials section
      if (romaData.testimonials && Array.isArray(romaData.testimonials)) {
        romaData.testimonials.forEach((review: any) => {
          if (review.quote || review.testimonial) {
            reviewsToSave.push({
              author: review.client_name || review.name || 'Anonymous',
              rating: review.rating || 5,
              text: review.quote || review.testimonial,
              date: review.date || new Date().toISOString(),
              platform: review.platform || 'Other',
              url: review.url,
            });
          }
        });
      }

      // Extract from featured_reviews.items (ROMA structure)
      if (romaData.featured_reviews?.items && Array.isArray(romaData.featured_reviews.items)) {
        romaData.featured_reviews.items.forEach((review: any) => {
          // The review object has: reviewer, stars, date, source, excerpt
          if (review.excerpt || review.text || review.review_text) {
            reviewsToSave.push({
              author: review.reviewer || review.reviewer_name || review.name || review.author || 'Anonymous',
              rating: review.stars || review.rating || 5,
              text: review.excerpt || review.text || review.review_text,
              date: review.date || review.review_date || new Date().toISOString(),
              platform: review.source || review.platform || 'Google',
              url: review.url || review.review_url,
            });
          }
        });
      }

      // Save each review to database (only if not already saved)
      for (const review of reviewsToSave) {
        try {
          // Check if this review already exists (by author + text combination)
          const { data: existing } = await supabase
            .from('reviews')
            .select('id')
            .eq('company_id', companyId)
            .eq('author', review.author)
            .eq('text', review.text)
            .single();

          if (existing) {
            continue; // Skip if already exists
          }

          // Parse date to ISO format
          let reviewDate = review.date;
          if (typeof reviewDate === 'number') {
            // Unix timestamp
            reviewDate = new Date(reviewDate * 1000).toISOString();
          } else if (reviewDate && !reviewDate.includes('T')) {
            // Date string without time
            reviewDate = new Date(reviewDate).toISOString();
          }

          // Insert review
          const { error: reviewError } = await supabase
            .from('reviews')
            .insert({
              company_id: companyId,
              organization_id: company.organization_id,
              author: review.author,
              rating: review.rating,
              text: review.text,
              date: reviewDate,
              platform: review.platform,
              url: review.url || null,
            });

          if (reviewError) {
            console.error('Error saving review:', reviewError);
            reviewErrors.push(`Failed to save review by ${review.author}: ${reviewError.message}`);
          } else {
            reviewCount++;
          }
        } catch (error) {
          console.error('Error processing review:', error);
          reviewErrors.push(`Error processing review: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Company data migrated! ${mediaCount} images and ${reviewCount} reviews saved.`,
      intake: updatedIntake,
      migrated_fields: Object.keys(migrationData),
      media_saved: mediaCount,
      reviews_saved: reviewCount,
      media_errors: mediaErrors.length > 0 ? mediaErrors : undefined,
      review_errors: reviewErrors.length > 0 ? reviewErrors : undefined,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    );
  }
}
