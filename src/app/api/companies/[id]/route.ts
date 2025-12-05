import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user's organization
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

    // Get company with organization verification
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch company',
        details: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user's organization
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

    // Verify company belongs to user's organization
    const { data: company } = await supabase
      .from('companies')
      .select('id, organization_id, email')
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    // Get update data from request body
    const body = await request.json();

    // If email is being changed, clear client temp password to force re-creation in Step 9
    if (body.email && body.email !== company.email) {
      console.log(`📧 Email changed from ${company.email} to ${body.email}`);
      console.log('🔄 Clearing client_temp_password to force user re-creation');
      body.client_temp_password = null;
    }

    // Update company
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating company:', updateError);
      return NextResponse.json(
        { error: 'Failed to update company', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCompany
    });

  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update company',
        details: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user's organization
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

    // Verify company belongs to user's organization
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, organization_id')
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    // Delete all related data in order (due to foreign key constraints)

    // 1. Delete onboarding steps
    await supabase
      .from('onboarding_steps')
      .delete()
      .eq('company_id', id);

    // 2. Delete intakes
    await supabase
      .from('intakes')
      .delete()
      .eq('company_id', id);

    // 3. Delete reviews
    await supabase
      .from('reviews')
      .delete()
      .eq('company_id', id);

    // 4. Delete media items
    await supabase
      .from('media_items')
      .delete()
      .eq('company_id', id);

    // 5. Finally, delete the company
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting company:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete company', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Company "${company.name}" and all related data deleted successfully`
    });

  } catch (error) {
    console.error('Delete company error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete company',
        details: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
