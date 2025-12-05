import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// POST /api/onboarding/complete-onboarding - Mark step 9 complete and move to DISCOVER status
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

    // Mark step 9 as complete
    const { error: stepError } = await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .eq('step_number', 9);

    if (stepError) {
      console.error('Error marking step 9 complete:', stepError);
      return NextResponse.json(
        { error: 'Failed to mark step 9 complete' },
        { status: 500 }
      );
    }

    // Determine package type based on plan
    const plan = company.plan?.toLowerCase();
    const packageType = (plan === 'verified' || plan === 'premium') ? 'verified' : 'discover';

    const now = new Date();
    const cycleStartDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const cycleEndDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Update company with onboarding completion
    const { error: statusError } = await supabase
      .from('companies')
      .update({
        status: 'ONBOARDED',
        package_type: packageType,
        onboarding_completed_at: now.toISOString(),
        current_cycle_start: cycleStartDate,
        updated_at: now.toISOString()
      })
      .eq('id', companyId);

    if (statusError) {
      console.error('Error updating company status:', statusError);
      return NextResponse.json(
        { error: 'Failed to update company status' },
        { status: 500 }
      );
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
        { error: 'Failed to create monthly cycle' },
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
      // Don't fail the whole operation if deliverables fail
    }

    console.log(`✅ Onboarding complete for company ${companyId} - moved to ONBOARDED status with ${packageType} package`);

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      status: 'ONBOARDED',
      packageType: packageType
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
