import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// POST /api/deliverables/initialize - Initialize monthly cycle for onboarded companies missing data
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.status !== 'ONBOARDED') {
      return NextResponse.json({ error: 'Company is not onboarded yet' }, { status: 400 });
    }

    // Check if monthly cycle already exists
    const { data: existingCycle } = await supabase
      .from('deliverable_months')
      .select('id')
      .eq('company_id', companyId)
      .limit(1)
      .single();

    if (existingCycle) {
      return NextResponse.json({ error: 'Monthly cycle already exists for this company' }, { status: 400 });
    }

    // Determine package type based on plan
    const plan = company.plan?.toLowerCase();
    const packageType = (plan === 'verified' || plan === 'premium') ? 'verified' : 'discover';

    const now = new Date();
    const cycleStartDate = now.toISOString().split('T')[0];
    const cycleEndDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Update company with package type if not set
    if (!company.package_type) {
      await supabase
        .from('companies')
        .update({
          package_type: packageType,
          current_cycle_start: cycleStartDate
        })
        .eq('id', companyId);
    }

    // Create first monthly cycle
    const { data: monthData, error: monthError } = await supabase
      .from('deliverable_months')
      .insert({
        company_id: companyId,
        month_number: 1,
        cycle_start_date: cycleStartDate,
        cycle_end_date: cycleEndDate,
        status: 'active'
      })
      .select()
      .single();

    if (monthError || !monthData) {
      console.error('Error creating first monthly cycle:', monthError);
      return NextResponse.json(
        { error: 'Failed to create monthly cycle', details: monthError },
        { status: 500 }
      );
    }

    // Create initial deliverables for this month
    const baseDeliverables = [
      { type: 'seo_blog', scheduled_publish_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { type: 'marketing_video', scheduled_publish_date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { type: 'review_highlight', scheduled_publish_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { type: 'social_fb', scheduled_publish_date: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { type: 'social_x', scheduled_publish_date: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { type: 'backlink', scheduled_publish_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { type: 'report_basic', scheduled_publish_date: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ];

    // Add verified-only deliverables
    if (packageType === 'verified') {
      baseDeliverables.push(
        { type: 'citation', scheduled_publish_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { type: 'social_ig', scheduled_publish_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { type: 'social_tiktok', scheduled_publish_date: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { type: 'social_yt', scheduled_publish_date: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { type: 'report_expanded', scheduled_publish_date: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { type: 'marketing_recommendations', scheduled_publish_date: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      );
    }

    const deliverablesToInsert = baseDeliverables.map(d => ({
      company_id: companyId,
      deliverable_month_id: monthData.id,
      type: d.type,
      status: 'not_started',
      scheduled_publish_date: d.scheduled_publish_date
    }));

    const { error: deliverablesError } = await supabase
      .from('deliverables')
      .insert(deliverablesToInsert);

    if (deliverablesError) {
      console.error('Error creating deliverables:', deliverablesError);
      return NextResponse.json(
        { error: 'Failed to create deliverables', details: deliverablesError },
        { status: 500 }
      );
    }

    console.log(`✅ Monthly cycle initialized for company ${companyId} with ${packageType} package (${baseDeliverables.length} deliverables)`);

    return NextResponse.json({
      success: true,
      message: 'Monthly cycle initialized successfully',
      packageType: packageType,
      deliverables: baseDeliverables.length
    });
  } catch (error) {
    console.error('Initialize deliverables error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize deliverables' },
      { status: 500 }
    );
  }
}
