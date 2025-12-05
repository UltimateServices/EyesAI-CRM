import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// GET /api/deliverables/[companyId]/months - Get all monthly cycles for a company
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all monthly cycles for this company
    const { data: months, error } = await supabase
      .from('deliverable_months')
      .select('*')
      .eq('company_id', companyId)
      .order('month_number', { ascending: true });

    if (error) {
      console.error('Error fetching months:', error);
      return NextResponse.json({ error: 'Failed to fetch months' }, { status: 500 });
    }

    return NextResponse.json({ months: months || [] });
  } catch (error) {
    console.error('Get months error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch months' },
      { status: 500 }
    );
  }
}
