import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// CORS headers for Webflow integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      plan, // 'discover' or 'verified'
      companyId,
      companyName,
      email,
      successUrl,
      cancelUrl,
    } = body;

    // Validate required fields
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Determine price ID based on plan
    const planLower = plan.toLowerCase();
    const isVerifiedPlan = planLower === 'verified' || planLower === 'pro';
    const priceId = isVerifiedPlan
      ? process.env.STRIPE_VERIFIED_PRICE_ID
      : process.env.STRIPE_BASIC_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured for plan: ${plan}` },
        { status: 500, headers: corsHeaders }
      );
    }

    // Build URLs - default to Webflow success page
    const webflowDomain = process.env.NEXT_PUBLIC_WEBFLOW_DOMAIN || 'https://eyesai.webflow.io';
    const finalSuccessUrl = successUrl || `${webflowDomain}/succes?session_id={CHECKOUT_SESSION_ID}${companyId ? `&company_id=${companyId}` : ''}`;
    const finalCancelUrl = cancelUrl || `${webflowDomain}/onboarding`;

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        company_id: companyId || '',
        company_name: companyName || '',
        plan: isVerifiedPlan ? 'VERIFIED' : 'DISCOVER',
        source: 'api',
      },
      subscription_data: {
        metadata: {
          company_id: companyId || '',
          plan: isVerifiedPlan ? 'VERIFIED' : 'DISCOVER',
        },
      },
    };

    // Add customer email if provided
    if (email) {
      sessionParams.customer_email = email;
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET endpoint to retrieve available plans
export async function GET() {
  const plans = [
    {
      id: 'discover',
      name: 'Discover',
      price: 39,
      priceId: process.env.STRIPE_BASIC_PRICE_ID,
      productId: process.env.STRIPE_BASIC_PRODUCT_ID,
      features: [
        'AI-Optimized Business Profile',
        'Monthly Content Updates',
        'Basic Analytics',
        'Email Support',
      ],
    },
    {
      id: 'verified',
      name: 'Verified',
      price: 69,
      priceId: process.env.STRIPE_VERIFIED_PRICE_ID,
      productId: process.env.STRIPE_VERIFIED_PRODUCT_ID,
      features: [
        'Everything in Discover',
        'Verified Badge',
        'Priority Placement',
        'Advanced Analytics',
        'Priority Support',
        'Custom Integrations',
      ],
    },
  ];

  return NextResponse.json({
    plans,
    currency: 'USD',
    interval: 'month',
  });
}
