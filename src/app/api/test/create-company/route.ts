import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/test/create-company - Test endpoint to create companies (simulates Stripe webhook)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const body = await req.json();
    const {
      name,
      email,
      phone,
      website,
      address,
      city,
      state,
      zipcode,
      plan = 'DISCOVER',
      package_type = 'DISCOVER',
    } = body;

    if (!name || !website) {
      return NextResponse.json(
        { error: 'Company name and website are required' },
        { status: 400 }
      );
    }

    // Get default organization
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (!orgs) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Create company with NEW status (only using fields that exist)
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
        website: website,
        plan: plan.toUpperCase(),
        status: 'NEW',
        organization_id: orgs.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return NextResponse.json(
        { error: 'Failed to create company', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Company "${name}" created successfully`,
      company,
    });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create company' },
      { status: 500 }
    );
  }
}
