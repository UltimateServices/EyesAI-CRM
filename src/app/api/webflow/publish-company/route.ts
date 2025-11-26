import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Webflow API constants
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID || '68db778020fc2ac5c78f401a';
const PROFILES_COLLECTION_ID = '6919a7f067ba553645e406a6';
const WEBFLOW_PREVIEW_DOMAIN = process.env.WEBFLOW_PREVIEW_DOMAIN || 'https://eyesai.ai';

// POST /api/webflow/publish-company - Publish a single company to Webflow
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get Webflow token from environment
    const webflowToken = process.env.WEBFLOW_CMS_SITE_API_TOKEN;

    if (!webflowToken) {
      return NextResponse.json(
        { error: 'Webflow API token not configured in environment' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Fetch the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Use existing webflow_slug if available, otherwise generate new one
    const baseSlug = `${company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${company.id.substring(0, 8)}`;
    const slug = company.webflow_slug || baseSlug;

    // Map to Webflow field names
    const webflowProfile = {
      fieldData: {
        // Required fields
        name: company.name,
        slug: slug,

        // Profile info
        'business-name': company.name,
        'social-handle': `@${company.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
        'short-description': company.tagline || company.about || '',

        // Contact info
        city: company.city || '',
        state: company.state || '',
        'visit-website-2': company.website || '',
        'call-now-2': company.phone?.replace(/[^0-9+]/g, '') || '',
        email: company.email || '',

        // Visibility settings
        spotlight: company.status === 'ACTIVE',
        directory: true,

        // Package type (must be 'discover' or 'verified')
        'package-type': (company.plan?.toLowerCase() === 'verified' || company.plan?.toLowerCase() === 'premium') ? 'verified' : 'discover',

        // Additional details
        'about-description': company.about || '',
        'ai-summary': company.ai_summary || '',
        'about-tag1': company.tag1 || '',
        'about-tag2': company.tag2 || '',
        'about-tag3': company.tag3 || '',
        'about-tag4': company.tag4 || '',
        'pricing-information': company.pricing_info || '',

        // Social media links
        'facebook-url': company.facebook_url || company.facebookUrl || '',
        'instagram-url': company.instagram_url || company.instagramUrl || '',
        'youtube-url': company.youtube_url || company.youtubeUrl || '',

        // Images
        'profile-image': company.logo_url || company.logoUrl ? { url: company.logo_url || company.logoUrl } : undefined,

        // Schema JSON for SEO/structured data
        'schema-json': JSON.stringify({
          googleMapsUrl: company.google_maps_url || company.googleMapsUrl || '',
          yelpUrl: company.yelp_url || company.yelpUrl || '',
          address: company.address || '',
          zip: company.zip || '',
        })
      }
    };

    // Remove undefined fields
    Object.keys(webflowProfile.fieldData).forEach(key => {
      if (webflowProfile.fieldData[key as keyof typeof webflowProfile.fieldData] === undefined) {
        delete webflowProfile.fieldData[key as keyof typeof webflowProfile.fieldData];
      }
    });

    // Check if profile already exists
    const listResponse = await fetch(
      `https://api.webflow.com/v2/collections/${PROFILES_COLLECTION_ID}/items`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${webflowToken}`,
          'accept': 'application/json'
        }
      }
    );

    let existingItem = null;
    if (listResponse.ok) {
      const listData = await listResponse.json();
      existingItem = listData.items?.find((item: any) => item.fieldData?.slug === slug);
    }

    // Create or update the profile
    let response;
    if (existingItem) {
      // Update existing item
      console.log(`Updating existing profile: ${company.name}`);
      response = await fetch(
        `https://api.webflow.com/v2/collections/${PROFILES_COLLECTION_ID}/items/${existingItem.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(webflowProfile)
        }
      );
    } else {
      // Create new item
      console.log(`Creating new profile: ${company.name}`);
      response = await fetch(
        `https://api.webflow.com/v2/collections/${PROFILES_COLLECTION_ID}/items`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(webflowProfile)
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();

      try {
        const errorData = JSON.parse(errorText);

        // Check if it's a slug conflict error (item was archived)
        if (errorData.code === 'validation_error' &&
            errorData.details?.some((d: any) => d.param === 'slug' && d.description?.includes('already in database'))) {

          console.log(`Slug conflict for ${company.name}, generating new slug with timestamp`);

          // Generate a new slug with timestamp to avoid archived item conflicts
          const newSlug = `${company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${company.id.substring(0, 8)}-${Date.now()}`;
          webflowProfile.fieldData.slug = newSlug;

          // Try creating again with the new slug
          const retryResponse = await fetch(
            `https://api.webflow.com/v2/collections/${PROFILES_COLLECTION_ID}/items`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${webflowToken}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
              },
              body: JSON.stringify(webflowProfile)
            }
          );

          if (!retryResponse.ok) {
            const retryError = await retryResponse.text();
            return NextResponse.json(
              { error: 'Failed to publish to Webflow', details: retryError },
              { status: 500 }
            );
          }

          response = retryResponse;
        } else {
          return NextResponse.json(
            { error: 'Failed to publish to Webflow', details: errorText },
            { status: 500 }
          );
        }
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Failed to publish to Webflow', details: errorText },
          { status: 500 }
        );
      }
    }

    const item = await response.json();

    // Publish the item
    const publishResponse = await fetch(
      `https://api.webflow.com/v2/collections/${PROFILES_COLLECTION_ID}/items/publish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${webflowToken}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ itemIds: [item.id] })
      }
    );

    if (!publishResponse.ok) {
      console.error(`Failed to publish ${company.name}`);
      // Continue anyway, item was created
    }

    // Update company with sync status
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        webflow_published: true,
        webflow_slug: webflowProfile.fieldData.slug,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error updating company sync status:', updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: `Successfully published ${company.name} to Webflow`,
      itemId: item.id,
      slug: webflowProfile.fieldData.slug,
      liveUrl: `${WEBFLOW_PREVIEW_DOMAIN}/profile/${webflowProfile.fieldData.slug}`,
    });
  } catch (error) {
    console.error('Publish company error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish company' },
      { status: 500 }
    );
  }
}
