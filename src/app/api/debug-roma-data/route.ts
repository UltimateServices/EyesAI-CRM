import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// GET /api/debug-roma-data?companyId=xxx - Debug roma_data structure
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    // Get ALL intake data
    const { data: intake, error } = await supabase
      .from('intakes')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error || !intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 });
    }

    const romaData = intake.roma_data;

    // Analyze structure
    const analysis = {
      has_roma_data: !!romaData,
      top_level_keys: romaData ? Object.keys(romaData) : [],

      // Check for images
      photos_exists: romaData?.photos !== undefined,
      photos_count: Array.isArray(romaData?.photos) ? romaData.photos.length : 0,
      photos_sample: Array.isArray(romaData?.photos) ? romaData.photos[0] : null,

      photo_gallery_exists: romaData?.photo_gallery !== undefined,
      photo_gallery_count: Array.isArray(romaData?.photo_gallery) ? romaData.photo_gallery.length : 0,
      photo_gallery_sample: Array.isArray(romaData?.photo_gallery) ? romaData.photo_gallery[0] : null,

      gallery_exists: romaData?.gallery !== undefined,
      gallery_count: Array.isArray(romaData?.gallery) ? romaData.gallery.length : 0,
      gallery_sample: Array.isArray(romaData?.gallery) ? romaData.gallery[0] : null,

      images_exists: romaData?.images !== undefined,
      images_count: Array.isArray(romaData?.images) ? romaData.images.length : 0,
      images_sample: Array.isArray(romaData?.images) ? romaData.images[0] : null,

      // Check for reviews
      reviews_exists: romaData?.reviews !== undefined,
      reviews_count: Array.isArray(romaData?.reviews) ? romaData.reviews.length : 0,
      reviews_sample: Array.isArray(romaData?.reviews) ? romaData.reviews[0] : null,

      google_reviews_exists: romaData?.google_reviews !== undefined,
      google_reviews_count: Array.isArray(romaData?.google_reviews) ? romaData.google_reviews.length : 0,
      google_reviews_sample: Array.isArray(romaData?.google_reviews) ? romaData.google_reviews[0] : null,

      testimonials_exists: romaData?.testimonials !== undefined,
      testimonials_count: Array.isArray(romaData?.testimonials) ? romaData.testimonials.length : 0,
      testimonials_sample: Array.isArray(romaData?.testimonials) ? romaData.testimonials[0] : null,

      featured_reviews_exists: romaData?.featured_reviews !== undefined,
      featured_reviews_count: romaData?.featured_reviews?.items ? romaData.featured_reviews.items.length : 0,
      featured_reviews_sample: romaData?.featured_reviews?.items?.[0] || null,
      featured_reviews_all_samples: romaData?.featured_reviews?.items?.slice(0, 3) || null,
      featured_reviews_keys: romaData?.featured_reviews?.items?.[0] ? Object.keys(romaData.featured_reviews.items[0]) : null,

      // Full structure
      full_roma_data: romaData,

      // Check intake table columns
      intake_has_project_gallery: intake.project_gallery !== null && intake.project_gallery !== undefined,
      project_gallery_count: Array.isArray(intake.project_gallery) ? intake.project_gallery.length : 0,
      project_gallery_sample: Array.isArray(intake.project_gallery) ? intake.project_gallery[0] : null,

      intake_has_before_after_images: intake.before_after_images !== null && intake.before_after_images !== undefined,
      before_after_images_count: Array.isArray(intake.before_after_images) ? intake.before_after_images.length : 0,

      intake_has_gallery_links: intake.gallery_links !== null && intake.gallery_links !== undefined,
      gallery_links_count: Array.isArray(intake.gallery_links) ? intake.gallery_links.length : 0,
      gallery_links_sample: Array.isArray(intake.gallery_links) ? intake.gallery_links[0] : null,

      // Full intake data (to see ALL columns)
      all_intake_columns: Object.keys(intake),
      full_intake: intake,
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Debug failed' },
      { status: 500 }
    );
  }
}
