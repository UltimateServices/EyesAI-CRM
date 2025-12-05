import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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
    const { sessionId, companyId } = await req.json();

    if (!sessionId && !companyId) {
      return NextResponse.json(
        { error: 'Session ID or Company ID required' },
        { status: 400, headers: corsHeaders }
      );
    }

    let company = null;

    // If we have a company ID, fetch company data
    if (companyId) {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, plan, status, stripe_customer_id, stripe_subscription_id, contact_email')
        .eq('id', companyId)
        .single();

      if (!error && data) {
        company = data;
      }
    }

    // If we have a session ID, verify with Stripe
    if (sessionId) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: '2024-11-20.acacia',
        });

        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId);

          // If session has company_id in metadata and we don't have company data yet
          if (session.metadata?.company_id && !company) {
            const { data } = await supabase
              .from('companies')
              .select('id, name, plan, status, stripe_customer_id, stripe_subscription_id, contact_email')
              .eq('id', session.metadata.company_id)
              .single();

            if (data) {
              company = data;
            }
          }

          return NextResponse.json({
            success: true,
            session: {
              id: session.id,
              status: session.status,
              payment_status: session.payment_status,
              customer_email: session.customer_details?.email,
            },
            company,
          }, { headers: corsHeaders });
        } catch (stripeError: any) {
          console.error('Stripe session verification failed:', stripeError.message);
          // Continue without Stripe data if verification fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      company,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Verify session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify session' },
      { status: 500, headers: corsHeaders }
    );
  }
}
