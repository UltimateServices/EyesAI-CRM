import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Webflow Form Webhook Handler
 *
 * This endpoint receives form submissions from Webflow's native form webhook.
 * Configure in Webflow: Site Settings → Forms → Webhook URL
 *
 * Since Webflow webhooks are async (don't wait for response),
 * this handler:
 * 1. Creates a company record
 * 2. Creates a Stripe checkout session
 * 3. Stores the checkout URL in the database
 * 4. Optionally sends an email with the checkout link
 *
 * The user should be redirected to a "check your email" page in Webflow.
 */

// Verify Webflow webhook signature
function verifyWebflowSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return true; // Skip verification if not configured

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    console.log('Webflow form webhook received:', JSON.stringify(body, null, 2));

    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('x-webflow-signature');
    const webhookSecret = process.env.WEBFLOW_WEBHOOK_SECRET;

    if (webhookSecret && !verifyWebflowSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Extract form data from Webflow webhook payload
    // Webflow sends: { name, payload: { data: { field1: value1, ... }, siteId, formId, ... } }
    const formData = body.payload?.data || body.data || body;

    // Map Webflow form fields to our data structure
    // Field names come from your Webflow form's field "Name" attribute
    const businessType = formData['business-type'] || formData['Business Type'] || formData.businessType || 'business';
    const website = formData['website-url'] || formData['Website URL'] || formData.url || formData.website || '';
    const companyName = formData['company-name'] || formData['Company Name'] || formData.name || formData.Name || '';
    const email = formData.email || formData.Email || formData['contact-email'] || '';
    const phone = formData.phone || formData.Phone || '';
    const selectedPlan = formData.plan || formData.Plan || formData['selected-plan'] || 'discover';

    // Validate required fields
    if (!companyName) {
      console.error('Missing company name in form submission');
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
    }

    // Get default organization
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (orgError || !orgs) {
      console.error('No organization found:', orgError);
      return NextResponse.json({ error: 'Organization not configured' }, { status: 500 });
    }

    // Create company record
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
        status: 'PENDING',
        source: 'webflow_form_webhook',
        business_type: businessType,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    console.log('Company created from webhook:', company.id);

    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    // Create Stripe checkout session
    const webflowDomain = process.env.NEXT_PUBLIC_WEBFLOW_DOMAIN || 'https://eyesai.webflow.io';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      metadata: {
        company_id: company.id,
        company_name: companyName,
        plan: plan,
        source: 'webflow_form_webhook',
        business_type: businessType,
        website: website,
      },
      success_url: `${webflowDomain}/succes?session_id={CHECKOUT_SESSION_ID}&company_id=${company.id}`,
      cancel_url: `${webflowDomain}/onboarding`,
      subscription_data: {
        metadata: {
          company_id: company.id,
          plan: plan,
        },
      },
      // Allow the session to be used for longer (for email links)
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    });

    console.log('Stripe checkout session created:', checkoutSession.id);

    // Update company with checkout info
    await supabase
      .from('companies')
      .update({
        stripe_checkout_session_id: checkoutSession.id,
        stripe_checkout_url: checkoutSession.url,
      })
      .eq('id', company.id);

    // Send email with checkout link if email provided
    if (email && checkoutSession.url) {
      const emailSent = await sendCheckoutEmail({
        email,
        companyName,
        checkoutUrl: checkoutSession.url,
        plan,
        price: isVerifiedPlan ? 69 : 39,
      });

      if (emailSent) {
        // Update company to mark email as sent
        await supabase
          .from('companies')
          .update({ checkout_email_sent_at: new Date().toISOString() })
          .eq('id', company.id);
      }
    }

    // Return success (Webflow expects 200 status)
    return NextResponse.json({
      success: true,
      message: 'Form submission processed',
      companyId: company.id,
      // Don't expose checkout URL in response for security
    });

  } catch (error: any) {
    console.error('Webflow webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint for verification/testing
export async function GET() {
  return NextResponse.json({
    message: 'Webflow Form Webhook Endpoint',
    status: 'active',
    usage: 'Configure this URL in Webflow: Site Settings → Forms → Webhook URL',
    url: 'https://eyes-ai-crm.vercel.app/api/webflow/form-webhook',
    expectedFields: {
      'company-name': 'Company name (required)',
      'website-url': 'Company website URL',
      'email': 'Contact email (for checkout link)',
      'phone': 'Contact phone',
      'plan': 'Selected plan (discover/verified)',
      'business-type': 'Business type (business/freelancer)',
    },
  });
}

interface CheckoutEmailData {
  email: string;
  companyName: string;
  checkoutUrl: string;
  plan: string;
  price: number;
}

/**
 * Send checkout email via Klaviyo
 * Triggers a "Checkout Link Requested" event that should be connected to a Klaviyo flow
 */
async function sendCheckoutEmail(data: CheckoutEmailData): Promise<boolean> {
  try {
    const KLAVIYO_PRIVATE_API_KEY = process.env.KLAVIYO_API_KEY;

    if (!KLAVIYO_PRIVATE_API_KEY) {
      console.error('KLAVIYO_API_KEY not configured - skipping email');
      return false;
    }

    console.log('Sending checkout email via Klaviyo...');
    console.log('  Recipient:', data.email);
    console.log('  Company:', data.companyName);

    // Step 1: Create or update profile in Klaviyo
    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15',
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email: data.email,
            properties: {
              company_name: data.companyName,
              selected_plan: data.plan,
              plan_price: data.price,
            },
          },
        },
      }),
    });

    let profileId: string;

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();

      // Handle duplicate profile (409 error)
      if (profileResponse.status === 409 && errorData.errors?.[0]?.code === 'duplicate_profile') {
        profileId = errorData.errors[0].meta.duplicate_profile_id;
        console.log('Using existing Klaviyo profile:', profileId);
      } else {
        console.error('Klaviyo profile error:', errorData);
        return false;
      }
    } else {
      const profileData = await profileResponse.json();
      profileId = profileData.data.id;
      console.log('Klaviyo profile created:', profileId);
    }

    // Step 2: Trigger a custom event for the checkout email flow
    const eventResponse = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15',
      },
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                id: profileId,
              },
            },
            metric: {
              data: {
                type: 'metric',
                attributes: {
                  name: 'Checkout Link Requested',
                },
              },
            },
            properties: {
              company_name: data.companyName,
              checkout_url: data.checkoutUrl,
              plan_name: data.plan,
              plan_price: `$${data.price}`,
              expires_in: '24 hours',
            },
            time: new Date().toISOString(),
          },
        },
      }),
    });

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      console.error('Klaviyo event error:', errorText);
      return false;
    }

    console.log('Klaviyo event triggered: Checkout Link Requested');
    console.log('Email will be sent via Klaviyo flow');

    return true;
  } catch (error) {
    console.error('Error sending checkout email:', error);
    return false;
  }
}
