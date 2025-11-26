import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// GET /api/onboarding/steps/[companyId] - Get onboarding steps for a company
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = params;

    // Get onboarding steps for this company
    const { data: steps, error } = await supabase
      .from('onboarding_steps')
      .select('*')
      .eq('company_id', companyId)
      .order('step_number', { ascending: true });

    if (error) {
      console.error('Error fetching onboarding steps:', error);
      return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 });
    }

    // If no steps exist, initialize them
    if (!steps || steps.length === 0) {
      const { error: initError } = await supabase.rpc('initialize_onboarding_steps', {
        p_company_id: companyId
      });

      if (initError) {
        console.error('Error initializing steps:', initError);
        return NextResponse.json({ error: 'Failed to initialize steps' }, { status: 500 });
      }

      // Fetch again after initialization
      const { data: newSteps, error: fetchError } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('company_id', companyId)
        .order('step_number', { ascending: true });

      if (fetchError) {
        console.error('Error fetching initialized steps:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 });
      }

      return NextResponse.json({ success: true, steps: newSteps || [] });
    }

    return NextResponse.json({ success: true, steps });
  } catch (error) {
    console.error('Onboarding steps error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch steps' },
      { status: 500 }
    );
  }
}

// PATCH /api/onboarding/steps/[companyId] - Update a specific step
export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = params;
    const body = await request.json();
    const { step_number, completed, metadata } = body;

    if (step_number === undefined) {
      return NextResponse.json({ error: 'step_number is required' }, { status: 400 });
    }

    // Update the step
    const updateData: any = {
      completed,
      updated_at: new Date().toISOString(),
    };

    if (completed) {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user.id;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data: step, error } = await supabase
      .from('onboarding_steps')
      .update(updateData)
      .eq('company_id', companyId)
      .eq('step_number', step_number)
      .select()
      .single();

    if (error) {
      console.error('Error updating step:', error);
      return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
    }

    // If this is step 9 (Welcome Email) being completed, move company to DISCOVER status
    if (step_number === 9 && completed) {
      const { error: updateCompanyError } = await supabase
        .from('companies')
        .update({ status: 'DISCOVER' })
        .eq('id', companyId);

      if (updateCompanyError) {
        console.error('Error updating company status:', updateCompanyError);
      }
    }

    return NextResponse.json({ success: true, step });
  } catch (error) {
    console.error('Update step error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update step' },
      { status: 500 }
    );
  }
}
