import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS headers for Webflow
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Webflow onboarding submission received:', body);

    // Extract form fields from Webflow webhook payload
    // Webflow sends form data in different formats depending on configuration
    const formData = body.data || body;

    // Map Webflow form fields to our data structure
    // Field names should match your Webflow form field names
    const businessType = formData['business-type'] || formData.businessType || formData.type || 'business';
    const website = formData['website-url'] || formData.url || formData.website || '';
    const companyName = formData['company-name'] || formData.companyName || formData.name || '';
    const email = formData.email || formData['contact-email'] || '';
    const phone = formData.phone || formData['contact-phone'] || '';
    const selectedPlan = formData.plan || formData['selected-plan'] || 'discover';

    // Validate required fields
    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine plan and price
    const planLower = selectedPlan.toLowerCase();
    const isVerifiedPlan = planLower === 'verified' || planLower === 'pro';
    const plan = isVerifiedPlan ? 'VERIFIED' : 'DISCOVER';
    const priceId = isVerifiedPlan
      ? process.env.STRIPE_VERIFIED_PRICE_ID
      : process.env.STRIPE_BASIC_PRICE_ID;

    if (!priceId) {
      console.error('Missing Stripe price ID for plan:', plan);
      return NextResponse.json(
        { error: 'Stripe price not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get default organization
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (orgError || !orgs) {
      console.error('No organization found:', orgError);
      return NextResponse.json(
        { error: 'Organization not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Create company record in CRM (status: PENDING until payment completes)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        organization_id: orgs.id,
        name: companyName,
        website: website,
        contact_email: email,
        phone: phone,
        plan: plan,
        package_type: plan.toLowerCase(),
        status: 'PENDING', // Will change to NEW after successful payment
        source: 'webflow_onboarding',
        business_type: businessType,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return NextResponse.json(
        { error: 'Failed to create company record', details: companyError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Company created:', company.id);

    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    // Create Stripe checkout session
    const webflowDomain = process.env.NEXT_PUBLIC_WEBFLOW_DOMAIN || 'https://eyesai.webflow.io';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      metadata: {
        company_id: company.id,
        company_name: companyName,
        plan: plan,
        source: 'webflow_onboarding',
        business_type: businessType,
        website: website,
      },
      // Redirect to Webflow success page after payment
      success_url: `${webflowDomain}/succes?session_id={CHECKOUT_SESSION_ID}&company_id=${company.id}`,
      cancel_url: `${webflowDomain}/onboarding`,
      subscription_data: {
        metadata: {
          company_id: company.id,
          plan: plan,
        },
      },
    });

    console.log('Stripe checkout session created:', checkoutSession.id);

    // Update company with checkout session ID for tracking
    await supabase
      .from('companies')
      .update({
        stripe_checkout_session_id: checkoutSession.id,
      })
      .eq('id', company.id);

    // Return the checkout URL
    // Webflow can use this to redirect the user
    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      companyId: company.id,
      plan: plan,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Webflow onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process onboarding' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Also support GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'Webflow Onboarding Submission Endpoint',
    usage: 'POST with form data to create company and get Stripe checkout URL',
    expectedFields: {
      'company-name': 'Company name (required)',
      'website-url': 'Company website URL',
      'email': 'Contact email',
      'phone': 'Contact phone',
      'plan': 'Selected plan (discover/verified)',
      'business-type': 'Business type (business/freelancer)',
    },
    response: {
      checkoutUrl: 'Stripe checkout URL to redirect user',
      sessionId: 'Stripe checkout session ID',
      companyId: 'Created company ID in CRM',
    },
  }, { headers: corsHeaders });
}
