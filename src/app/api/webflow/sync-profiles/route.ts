import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/webflow/sync-profiles - Sync all companies to Webflow as Profiles
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

    // Map companies to Webflow Profile format
    const profiles = companies.map((company) => ({
      // Required fields
      id: company.id,
      name: company.name,
      slug: company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      socialHandle: company.name.toLowerCase().replace(/[^a-z0-9]+/g, ''),

      // Optional fields
      shortDescription: company.tagline || '',
      city: company.city || '',
      state: company.state || '',
      websiteUrl: company.website || '',
      phoneNumber: company.phone || '',
      emailAddress: company.email || '',
      spotlight: company.status === 'ACTIVE',
      directory: true,
      packageType: company.plan || 'DISCOVER',

      // Metadata
      updatedAt: company.updated_at || new Date().toISOString(),
    }));

    // Send profiles to Webflow bridge app
    const syncEndpoint = `${webflowAppUrl}/api/sync/profiles`;

    const response = await fetch(syncEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${crmApiKey}`,
        'X-Webflow-Token': webflowApiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profiles }),
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
      message: `Successfully synced ${companies.length} profile(s) to Webflow`,
      synced: companies.length,
      data: result,
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
