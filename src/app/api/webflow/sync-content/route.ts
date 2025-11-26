import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Webflow API constants
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID || '68db778020fc2ac5c78f401a';
const PROFILES_COLLECTION_ID = '6919a7f067ba553645e406a6';
const BLOGS_COLLECTION_ID = '6924108f80f9c5582bc96d73';

// Helper function to find Webflow Profile ID by company slug
async function findProfileId(companySlug: string, webflowToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${PROFILES_COLLECTION_ID}/items`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${webflowToken}`,
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const profile = data.items?.find((item: any) => item.fieldData?.slug === companySlug);
    return profile?.id || null;
  } catch (error) {
    console.error('Error finding profile:', error);
    return null;
  }
}

// POST /api/webflow/sync-content - Sync blogs to Webflow
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

    // Fetch all published blogs for this organization
    const { data: blogs, error: fetchError } = await supabase
      .from('blogs')
      .select(`
        *,
        companies!inner(id, name, organization_id)
      `)
      .eq('companies.organization_id', membership.organization_id)
      .eq('status', 'published');

    if (fetchError) {
      console.error('Error fetching blogs:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch blogs', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!blogs || blogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No published blogs to sync',
        synced: 0,
      });
    }

    // Sync each blog to Webflow
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ blogId: string; blogTitle: string; error: string }>,
    };

    for (const blog of blogs) {
      try {
        // Generate slug from blog title
        const slug = `${blog.h1.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${blog.id.substring(0, 8)}`;

        // Generate company slug to find the profile
        const companySlug = `${blog.companies.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${blog.company_id.substring(0, 8)}`;

        // Find the Webflow Profile ID for this company
        const profileId = await findProfileId(companySlug, webflowToken);

        if (!profileId) {
          results.failed++;
          results.errors.push({
            blogId: blog.id,
            blogTitle: blog.h1,
            error: `Profile not found for company: ${blog.companies.name}. Sync the company profile first.`
          });
          continue;
        }

        // Map to Webflow Blogs field names
        const webflowBlog = {
          fieldData: {
            // Required fields
            name: blog.h1, // Title
            slug: slug,

            // Content
            body: blog.content || '', // RichText content

            // Profile reference
            profile: profileId,

            // Optional fields
            'publish-date': blog.published_at || blog.created_at || new Date().toISOString(),
            'category-tag': blog.category || '',
            'cover-image': blog.cover_image_url ? { url: blog.cover_image_url } : undefined,
            'schema-json': JSON.stringify({
              metaTitle: blog.meta_title || blog.h1,
              metaDescription: blog.meta_description || '',
              keywords: blog.keywords || []
            })
          }
        };

        // Remove undefined fields
        Object.keys(webflowBlog.fieldData).forEach(key => {
          if (webflowBlog.fieldData[key as keyof typeof webflowBlog.fieldData] === undefined) {
            delete webflowBlog.fieldData[key as keyof typeof webflowBlog.fieldData];
          }
        });

        // Check if blog already exists
        const listResponse = await fetch(
          `https://api.webflow.com/v2/collections/${BLOGS_COLLECTION_ID}/items`,
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

        // Create or update the blog
        let response;
        if (existingItem) {
          // Update existing item
          console.log(`Updating existing blog: ${blog.h1}`);
          response = await fetch(
            `https://api.webflow.com/v2/collections/${BLOGS_COLLECTION_ID}/items/${existingItem.id}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${webflowToken}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
              },
              body: JSON.stringify(webflowBlog)
            }
          );
        } else {
          // Create new item
          console.log(`Creating new blog: ${blog.h1}`);
          response = await fetch(
            `https://api.webflow.com/v2/collections/${BLOGS_COLLECTION_ID}/items`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${webflowToken}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
              },
              body: JSON.stringify(webflowBlog)
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

              console.log(`Slug conflict for blog ${blog.h1}, generating new slug with timestamp`);

              // Generate a new slug with timestamp to avoid archived item conflicts
              const newSlug = `${blog.h1.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${blog.id.substring(0, 8)}-${Date.now()}`;
              webflowBlog.fieldData.slug = newSlug;

              // Try creating again with the new slug
              const retryResponse = await fetch(
                `https://api.webflow.com/v2/collections/${BLOGS_COLLECTION_ID}/items`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${webflowToken}`,
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                  },
                  body: JSON.stringify(webflowBlog)
                }
              );

              if (!retryResponse.ok) {
                const retryError = await retryResponse.text();
                console.error(`Failed to sync blog ${blog.h1} after retry:`, retryError);
                results.failed++;
                results.errors.push({
                  blogId: blog.id,
                  blogTitle: blog.h1,
                  error: retryError
                });
                continue;
              }

              response = retryResponse;
            } else {
              console.error(`Failed to sync blog ${blog.h1}:`, errorText);
              results.failed++;
              results.errors.push({
                blogId: blog.id,
                blogTitle: blog.h1,
                error: errorText
              });
              continue;
            }
          } catch (parseError) {
            console.error(`Failed to sync blog ${blog.h1}:`, errorText);
            results.failed++;
            results.errors.push({
              blogId: blog.id,
              blogTitle: blog.h1,
              error: errorText
            });
            continue;
          }
        }

        const item = await response.json();

        // Publish the item
        const publishResponse = await fetch(
          `https://api.webflow.com/v2/collections/${BLOGS_COLLECTION_ID}/items/publish`,
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
          console.error(`Failed to publish blog ${blog.h1}`);
        }

        results.successful++;

      } catch (error) {
        console.error(`Error syncing blog ${blog.h1}:`, error);
        results.failed++;
        results.errors.push({
          blogId: blog.id,
          blogTitle: blog.h1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.successful} of ${blogs.length} blog(s) to Webflow`,
      synced: results.successful,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Sync content error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Sync failed',
        details: 'Could not sync content to Webflow'
      },
      { status: 500 }
    );
  }
}
