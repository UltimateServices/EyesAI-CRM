import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
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

    // Fetch intake data
    const { data: intake, error } = await supabase
      .from('intakes')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching intake:', error);
      return NextResponse.json(
        { error: 'Failed to fetch intake data', details: error.message },
        { status: 500 }
      );
    }

    if (!intake) {
      return NextResponse.json(
        { error: 'No intake data found for this company' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      intake: intake,
    });

  } catch (error) {
    console.error('Fetch intake error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch intake',
        details: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
