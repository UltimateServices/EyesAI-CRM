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

    // Auto-run migration to update companies table
    console.log('Auto-running migration for company:', companyId);
    const migrationResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/migrate-company-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ companyId }),
      }
    );

    if (!migrationResponse.ok) {
      console.error('Migration failed:', await migrationResponse.text());
      return NextResponse.json(
        {
          error: 'Intake saved but migration failed',
          details: 'Data saved to intakes table but failed to update companies table',
          intake: result
        },
        { status: 500 }
      );
    }

    const migrationData = await migrationResponse.json();
    console.log('Migration completed:', migrationData);

    // Extract and save reviews from ROMA data
    let reviewsCount = 0;
    try {
      const featuredReviews = romaData.featured_reviews?.items || romaData.featured_reviews || [];

      if (Array.isArray(featuredReviews) && featuredReviews.length > 0) {
        // Delete existing reviews for this company to avoid duplicates
        await supabase
          .from('reviews')
          .delete()
          .eq('companyId', companyId);

        const reviewsToInsert = featuredReviews.map((review: any, index: number) => ({
          companyId,
          source: review.source || review.platform || 'google',
          author: review.author || review.author_name || review.reviewer_name || 'Anonymous',
          rating: review.rating || review.stars || 5,
          text: review.text || review.review_text || review.comment || '',
          date: review.date || review.review_date || review.time_description || new Date().toISOString(),
          url: review.url || review.review_url || null,
          verified: review.verified || false,
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

    // Extract and save media items from ROMA data
    let mediaCount = 0;
    try {
      const mediaItems: any[] = [];

      // Extract logo from hero section
      const logoUrl = romaData.hero?.hero_image_url || romaData.hero?.logo_url || romaData.hero?.image;
      if (logoUrl) {
        mediaItems.push({
          companyId,
          url: logoUrl,
          category: 'logo',
          internal_tags: ['logo'],
          display_order: 0,
          organizationId: membership.organization_id,
        });
      }

      // Extract gallery images from photo_gallery
      const galleryImages = romaData.photo_gallery?.images || romaData.photo_gallery || [];
      if (Array.isArray(galleryImages)) {
        galleryImages.forEach((image: any, index: number) => {
          const imageUrl = typeof image === 'string' ? image : (image.url || image.image_url || image.src);
          if (imageUrl) {
            mediaItems.push({
              companyId,
              url: imageUrl,
              category: 'photo',
              alt_text: typeof image === 'object' ? (image.alt || image.caption || '') : '',
              display_order: index + 1,
              organizationId: membership.organization_id,
            });
          }
        });
      }

      if (mediaItems.length > 0) {
        // Delete existing media for this company to avoid duplicates
        await supabase
          .from('media_items')
          .delete()
          .eq('companyId', companyId);

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
      migration: migrationData,
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
