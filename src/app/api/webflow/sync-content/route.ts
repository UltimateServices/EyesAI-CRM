import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/webflow/sync-content - Sync blogs to Webflow
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get request body
    const body = await request.json();
    const { webflowAppUrl, webflowApiToken, crmApiKey } = body;

    if (!webflowAppUrl || !webflowApiToken || !crmApiKey) {
      return NextResponse.json(
        { error: 'Webflow App URL, Webflow API Token, and CRM API Key are required' },
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

    // Map blogs to Webflow format
    const content = blogs.map((blog: any) => ({
      // Required fields
      id: blog.id,
      title: blog.h1,
      slug: blog.h1.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      companyId: blog.company_id,
      companyName: blog.companies.name,

      // Content fields
      content: blog.content,
      h2: blog.h2 || '',
      quickAnswer: blog.quick_answer || '',
      keyTakeaways: blog.key_takeaways || [],
      faqs: blog.faqs || [],

      // SEO fields
      metaTitle: blog.meta_title || blog.h1,
      metaDescription: blog.meta_description || '',
      keywords: blog.keywords || [],

      // Author
      authorName: blog.author_name || 'EyesAI Team',
      authorTitle: blog.author_title || '',
      authorBio: blog.author_bio || '',

      // Publishing
      publishedUrl: blog.published_url || '',
      publishedAt: blog.published_at || blog.created_at,

      // Images
      selectedImages: blog.selected_images || [],

      // Metadata
      updatedAt: blog.updated_at || new Date().toISOString(),
    }));

    // Send content to Webflow bridge app
    const syncEndpoint = `${webflowAppUrl}/api/sync/content`;

    const response = await fetch(syncEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${crmApiKey}`,
        'X-Webflow-Token': webflowApiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'blogs',
        content,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webflow sync error:', errorText);
      return NextResponse.json(
        {
          error: 'Sync to Webflow failed',
          details: errorText,
          status: response.status
        },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${blogs.length} blog(s) to Webflow`,
      synced: blogs.length,
      data: result,
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
