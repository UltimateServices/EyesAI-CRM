import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { companyId, romaData } = await request.json();

    if (!companyId || !romaData) {
      return NextResponse.json(
        { error: 'Company ID and ROMA data are required' },
        { status: 400 }
      );
    }

    // Validate that romaData is an object
    if (typeof romaData !== 'object' || Array.isArray(romaData)) {
      return NextResponse.json(
        { error: 'Invalid ROMA data format - must be a JSON object' },
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

    // Check if intake already exists
    const { data: existingIntake } = await supabase
      .from('intakes')
      .select('id')
      .eq('company_id', companyId)
      .single();

    let result;
    if (existingIntake) {
      // Update existing intake
      const { data, error } = await supabase
        .from('intakes')
        .update({
          roma_data: romaData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntake.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating intake:', error);
        return NextResponse.json(
          { error: 'Failed to update intake data', details: error.message },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new intake
      const { data, error } = await supabase
        .from('intakes')
        .insert({
          company_id: companyId,
          roma_data: romaData,
          organization_id: membership.organization_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating intake:', error);
        return NextResponse.json(
          { error: 'Failed to save intake data', details: error.message },
          { status: 500 }
        );
      }
      result = data;
    }

    // Auto-run migration to update companies table
    console.log('Auto-running migration for company:', companyId);
    const migrationResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/migrate-company-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ companyId }),
      }
    );

    if (!migrationResponse.ok) {
      console.error('Migration failed:', await migrationResponse.text());
      return NextResponse.json(
        {
          error: 'Intake saved but migration failed',
          details: 'Data saved to intakes table but failed to update companies table',
          intake: result
        },
        { status: 500 }
      );
    }

    const migrationData = await migrationResponse.json();
    console.log('Migration completed:', migrationData);

    // Mark Step 2 as complete
    const { error: stepError } = await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .eq('step_number', 2);

    if (stepError) {
      console.error('Error completing step 2:', stepError);
      // Don't fail the request, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Intake data saved and migrated successfully',
      intake: result,
      migration: migrationData,
    });

  } catch (error) {
    console.error('Paste intake error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save intake',
        details: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
