import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// GET /api/webflow/settings - Get Webflow settings for organization
export async function GET(request: NextRequest) {
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

    // Get Webflow settings
    const { data: settings, error: settingsError } = await supabase
      .from('webflow_settings')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({
      settings: settings || {
        webflow_app_url: '',
        webflow_api_token: '',
        crm_api_key: '',
      }
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/webflow/settings - Save Webflow settings
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization and check if admin
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    if (membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update settings' }, { status: 403 });
    }

    const body = await request.json();
    const { webflowAppUrl, webflowApiToken, crmApiKey } = body;

    // Upsert settings (insert or update)
    const { data: settings, error: upsertError } = await supabase
      .from('webflow_settings')
      .upsert({
        organization_id: membership.organization_id,
        webflow_app_url: webflowAppUrl,
        webflow_api_token: webflowApiToken,
        crm_api_key: crmApiKey,
      }, {
        onConflict: 'organization_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error saving settings:', upsertError);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
