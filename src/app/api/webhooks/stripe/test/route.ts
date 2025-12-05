import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const basicProductId = process.env.STRIPE_BASIC_PRODUCT_ID;
    const verifiedProductId = process.env.STRIPE_VERIFIED_PRODUCT_ID;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is not configured in environment variables' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    // Test 1: Get account info
    const account = await stripe.accounts.retrieve();

    // Test 2: Get products
    const products = [];

    if (basicProductId) {
      try {
        const basicProduct = await stripe.products.retrieve(basicProductId);
        products.push({
          id: basicProduct.id,
          name: basicProduct.name,
          type: 'Basic'
        });
      } catch (err) {
        products.push({
          id: basicProductId,
          name: 'Not found',
          type: 'Basic',
          error: true
        });
      }
    }

    if (verifiedProductId) {
      try {
        const verifiedProduct = await stripe.products.retrieve(verifiedProductId);
        products.push({
          id: verifiedProduct.id,
          name: verifiedProduct.name,
          type: 'Verified'
        });
      } catch (err) {
        products.push({
          id: verifiedProductId,
          name: 'Not found',
          type: 'Verified',
          error: true
        });
      }
    }

    // Test 3: Check webhook endpoints
    const webhookEndpoints = await stripe.webhookEndpoints.list({ limit: 10 });
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || 'https://eyes-ai-crm.vercel.app/api/webhooks/stripe';
    const configuredWebhook = webhookEndpoints.data.find(ep => ep.url === webhookUrl);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        type: account.type,
      },
      products,
      webhook: {
        configured: !!configuredWebhook,
        url: webhookUrl,
        secret: webhookSecret ? 'Set' : 'Not set',
        status: configuredWebhook?.status || 'not found',
        events: configuredWebhook?.enabled_events || [],
      },
      environment: {
        secretKey: stripeSecretKey ? 'Set' : 'Not set',
        webhookSecret: webhookSecret ? 'Set' : 'Not set',
        basicProductId: basicProductId || 'Not set',
        verifiedProductId: verifiedProductId || 'Not set',
      }
    });

  } catch (error: any) {
    console.error('Stripe test error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to test Stripe connection',
        details: error.stack
      },
      { status: 500 }
    );
  }
}
