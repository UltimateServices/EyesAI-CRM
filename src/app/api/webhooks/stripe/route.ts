import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role client for webhook handlers (no auth context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Initialize Stripe only when the endpoint is called
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Missing Stripe configuration');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Stripe webhook received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  const customer = session.customer_details;
  const metadata = session.metadata || {};

  // Check if company already exists (from Webflow onboarding flow)
  const existingCompanyId = metadata.company_id;

  if (existingCompanyId) {
    // UPDATE existing company (Webflow onboarding flow)
    console.log('Updating existing company:', existingCompanyId);

    const { error: updateError } = await supabase
      .from('companies')
      .update({
        status: 'NEW',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        contact_email: customer?.email || metadata.email || undefined,
        contact_name: customer?.name || undefined,
        stripe_checkout_completed_at: new Date().toISOString(),
      })
      .eq('id', existingCompanyId);

    if (updateError) {
      console.error('Error updating company:', updateError);
      return;
    }

    console.log('Company updated with Stripe info:', existingCompanyId);

    // Initialize onboarding steps
    await initializeOnboardingSteps(existingCompanyId);

  } else {
    // CREATE new company (direct Stripe checkout without Webflow)
    console.log('Creating new company from Stripe checkout');

    // Get default organization
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (!orgs) {
      console.error('No organization found');
      return;
    }

    const companyData = {
      organization_id: orgs.id,
      name: metadata.company_name || customer?.name || 'New Company',
      contact_name: customer?.name || metadata.contact_name || '',
      contact_email: customer?.email || metadata.email || '',
      phone: customer?.phone || metadata.phone || '',
      website: metadata.website || '',
      address: customer?.address?.line1 || metadata.address || '',
      city: customer?.address?.city || metadata.city || '',
      state: customer?.address?.state || metadata.state || '',
      zipcode: customer?.address?.postal_code || metadata.zipcode || '',
      plan: metadata.plan || 'DISCOVER',
      package_type: (metadata.plan || 'DISCOVER').toLowerCase(),
      status: 'NEW',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      source: metadata.source || 'stripe_direct',
    };

    const { data: company, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return;
    }

    console.log('Company created:', company.id);

    // Initialize onboarding steps
    await initializeOnboardingSteps(company.id);
  }
}

async function initializeOnboardingSteps(companyId: string) {
  // Initialize onboarding steps for the company
  const { error: initStepsError } = await supabase.rpc('initialize_onboarding_steps', {
    p_company_id: companyId
  });

  if (initStepsError) {
    console.error('Error initializing onboarding steps:', initStepsError);
    // Try alternative: manually insert steps if RPC doesn't exist
    return;
  }

  // Mark Step 1 (Stripe Signup) as complete
  const { error: completeStepError } = await supabase
    .from('onboarding_steps')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('step_number', 1);

  if (completeStepError) {
    console.error('Error completing step 1:', completeStepError);
  } else {
    console.log('Step 1 (Stripe Signup) marked as complete for company:', companyId);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);

  const metadata = subscription.metadata || {};
  const companyId = metadata.company_id;

  if (companyId) {
    // Update company with subscription details
    const { error } = await supabase
      .from('companies')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', companyId);

    if (error) {
      console.error('Error updating company subscription:', error);
    } else {
      console.log('Company subscription updated:', companyId);
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  // Find company by subscription ID
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (company) {
    const { error } = await supabase
      .from('companies')
      .update({
        subscription_status: subscription.status,
        subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', company.id);

    if (error) {
      console.error('Error updating subscription status:', error);
    } else {
      console.log('Subscription status updated for company:', company.id);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted/cancelled:', subscription.id);

  // Find company by subscription ID
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (company) {
    const { error } = await supabase
      .from('companies')
      .update({
        subscription_status: 'cancelled',
        status: 'CHURNED',
      })
      .eq('id', company.id);

    if (error) {
      console.error('Error updating cancelled subscription:', error);
    } else {
      console.log('Subscription cancelled for company:', company.id);
    }
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id);

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Find company by subscription ID
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (company) {
    const { error } = await supabase
      .from('companies')
      .update({
        subscription_status: 'active',
        last_payment_date: new Date().toISOString(),
        last_payment_amount: invoice.amount_paid / 100, // Convert from cents
      })
      .eq('id', company.id);

    if (error) {
      console.error('Error updating payment success:', error);
    } else {
      console.log('Payment recorded for company:', company.id);
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id);

  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Find company by subscription ID
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (company) {
    const { error } = await supabase
      .from('companies')
      .update({
        subscription_status: 'past_due',
        payment_failed_at: new Date().toISOString(),
      })
      .eq('id', company.id);

    if (error) {
      console.error('Error updating payment failure:', error);
    } else {
      console.log('Payment failure recorded for company:', company.id);
      // TODO: Send notification to staff and customer about failed payment
    }
  }
}
