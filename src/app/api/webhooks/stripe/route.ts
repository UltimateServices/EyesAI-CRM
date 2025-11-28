import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

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

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
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

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Get customer details
  const customer = session.customer_details;
  const metadata = session.metadata || {};

  // Extract company info from session metadata or customer details
  const companyData = {
    name: metadata.company_name || customer?.name || 'New Company',
    email: customer?.email || metadata.email || '',
    phone: customer?.phone || metadata.phone || '',
    website: metadata.website || '',
    address: metadata.address || customer?.address?.line1 || '',
    city: metadata.city || customer?.address?.city || '',
    state: metadata.state || customer?.address?.state || '',
    zipcode: metadata.zipcode || customer?.address?.postal_code || '',
    plan: metadata.plan || 'DISCOVER',
    package_type: metadata.package_type || 'DISCOVER',
    status: 'NEW',
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
  };

  // Get default organization (you may want to change this logic)
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single();

  if (!orgs) {
    console.error('No organization found');
    return;
  }

  // Create company
  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      ...companyData,
      organization_id: orgs.id,
      contact_email: companyData.email,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    return;
  }

  console.log('Company created:', company.id);

  // Initialize onboarding steps for the new company
  const { error: initStepsError } = await supabase.rpc('initialize_onboarding_steps', {
    p_company_id: company.id
  });

  if (initStepsError) {
    console.error('Error initializing onboarding steps:', initStepsError);
  } else {
    // Mark Step 1 (Stripe Signup) as complete
    const { error: completeStepError } = await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('company_id', company.id)
      .eq('step_number', 1);

    if (completeStepError) {
      console.error('Error completing step 1:', completeStepError);
    } else {
      console.log('Step 1 (Stripe Signup) marked as complete');
    }
  }

  // TODO: Send notification to staff about new client
  // TODO: Trigger welcome email
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  // Handle subscription logic if needed
}
