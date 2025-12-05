import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// GET /api/deliverables/[companyId]/month/[monthId] - Get deliverables for a specific month
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; monthId: string }> }
) {
  try {
    const { companyId, monthId } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all deliverables for this month
    const { data: deliverables, error } = await supabase
      .from('deliverables')
      .select('*')
      .eq('company_id', companyId)
      .eq('deliverable_month_id', monthId)
      .order('scheduled_publish_date', { ascending: true });

    if (error) {
      console.error('Error fetching deliverables:', error);
      return NextResponse.json({ error: 'Failed to fetch deliverables' }, { status: 500 });
    }

    return NextResponse.json({ deliverables: deliverables || [] });
  } catch (error) {
    console.error('Get deliverables error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deliverables' },
      { status: 500 }
    );
  }
}
