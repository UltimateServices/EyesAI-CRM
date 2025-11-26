import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Webflow API constants
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID || '68db778020fc2ac5c78f401a';
const PROFILES_COLLECTION_ID = '6919a7f067ba553645e406a6';

// POST /api/webflow/sync-profiles - Sync all companies to Webflow as Profiles
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get Webflow token from environment
    const webflowToken = process.env.WEBFLOW_CMS_SITE_API_TOKEN;

    if (!webflowToken) {
      return NextResponse.json(
        { error: 'Webflow API token not configured' },
        { status: 500 }
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

    // Fetch all companies for this organization
    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('*')
      .eq('organization_id', membership.organization_id);

    if (fetchError) {
      console.error('Error fetching companies:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch companies', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No companies to sync',
        synced: 0,
      });
    }

    // Sync each company to Webflow
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ companyId: string; companyName: string; error: string }>,
    };

    for (const company of companies) {
      try {
        // Generate slug from company name
        const slug = `${company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${company.id.substring(0, 8)}`;

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
          }
        };

        // Check if profile already exists by fetching items and finding by slug
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
              console.error(`Failed to sync ${company.name} after retry:`, retryError);
              results.failed++;
              results.errors.push({
                companyId: company.id,
                companyName: company.name,
                error: retryError
              });
              continue;
            }

            response = retryResponse;
          } else {
            console.error(`Failed to sync ${company.name}:`, errorText);
            results.failed++;
            results.errors.push({
              companyId: company.id,
              companyName: company.name,
              error: errorText
            });
            continue;
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
        }

        results.successful++;

      } catch (error) {
        console.error(`Error syncing ${company.name}:`, error);
        results.failed++;
        results.errors.push({
          companyId: company.id,
          companyName: company.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.successful} of ${companies.length} profile(s) to Webflow`,
      synced: results.successful,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Sync profiles error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Sync failed',
        details: 'Could not sync profiles to Webflow'
      },
      { status: 500 }
    );
  }
}
