import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// POST /api/webflow/publish-company - Publish a single company to Webflow
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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

    // Get Webflow settings
    const { data: settings, error: settingsError } = await supabase
      .from('webflow_settings')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Webflow settings not configured. Please configure in Settings.' },
        { status: 400 }
      );
    }

    if (!settings.webflow_app_url || !settings.webflow_api_token || !settings.crm_api_key) {
      return NextResponse.json(
        { error: 'Incomplete Webflow settings. Please complete configuration in Settings.' },
        { status: 400 }
      );
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

    // Generate slug and social handle
    const slug = company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const socialHandle = '@' + company.name.toLowerCase().replace(/[^a-z0-9]+/g, '');

    // Map company to Webflow profile schema (matching bridge app spec exactly)
    const profile = {
      id: company.id,
      name: company.name,
      slug: slug,
      socialHandle: socialHandle,
      shortDescription: company.tagline || company.description || '',
      city: company.city || '',
      state: company.state || '',
      websiteUrl: company.website || '',
      phoneNumber: company.phone || '',
      emailAddress: company.email || '',
      spotlight: company.status === 'ACTIVE',
      directory: true,
      packageType: (company.plan || 'DISCOVER').toLowerCase()
    };

    // Send to Webflow bridge app (matches bridge app format)
    const webflowResponse = await fetch(`${settings.webflow_app_url}/api/sync/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: settings.crm_api_key,
        profiles: [profile], // Bridge app expects array
      }),
    });

    if (!webflowResponse.ok) {
      const errorData = await webflowResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Failed to publish to Webflow',
          details: errorData.error || webflowResponse.statusText,
        },
        { status: 500 }
      );
    }

    const result = await webflowResponse.json();

    // Update company with sync status
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        webflow_published: true,
        webflow_slug: slug,
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
      result,
      liveUrl: `https://eyesai.ai/profiles/${slug}`,
    });
  } catch (error) {
    console.error('Publish company error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish company' },
      { status: 500 }
    );
  }
}
