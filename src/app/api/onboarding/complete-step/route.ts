import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// POST /api/onboarding/complete-step - Mark any step as complete
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, stepNumber } = await req.json();

    if (!companyId || !stepNumber) {
      return NextResponse.json(
        { error: 'companyId and stepNumber are required' },
        { status: 400 }
      );
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Mark step as complete
    const { error: stepError } = await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .eq('step_number', stepNumber);

    if (stepError) {
      console.error('Error marking step complete:', stepError);
      return NextResponse.json(
        { error: 'Failed to mark step complete' },
        { status: 500 }
      );
    }

    console.log(`✅ Step ${stepNumber} marked complete for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: `Step ${stepNumber} marked complete`,
    });
  } catch (error) {
    console.error('Complete step error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete step' },
      { status: 500 }
    );
  }
}
