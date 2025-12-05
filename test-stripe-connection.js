const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

// Load .env file manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

async function testStripeConnection() {
  console.log('🔍 Testing Stripe Connection...\n');

  // Check if environment variables are set
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('Environment Variables:');
  console.log('✓ STRIPE_SECRET_KEY:', secretKey ? `${secretKey.substring(0, 20)}...` : '❌ NOT SET');
  console.log('✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', publishableKey ? `${publishableKey.substring(0, 20)}...` : '❌ NOT SET');
  console.log('✓ STRIPE_WEBHOOK_SECRET:', webhookSecret ? `${webhookSecret.substring(0, 20)}...` : '❌ NOT SET');
  console.log();

  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY is not set!');
    process.exit(1);
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    // Test 1: Retrieve account info
    console.log('Test 1: Retrieving Stripe account info...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Account ID:', account.id);
    console.log('✅ Account Type:', account.type);
    console.log('✅ Email:', account.email || 'Not set');
    console.log();

    // Test 2: Verify products exist
    console.log('Test 2: Verifying Stripe products...');
    const basicProductId = process.env.STRIPE_BASIC_PRODUCT_ID;
    const verifiedProductId = process.env.STRIPE_VERIFIED_PRODUCT_ID;

    if (basicProductId) {
      try {
        const basicProduct = await stripe.products.retrieve(basicProductId);
        console.log('✅ Basic Product:', basicProduct.name);
      } catch (err) {
        console.log('❌ Basic Product not found:', basicProductId);
      }
    } else {
      console.log('⚠️  STRIPE_BASIC_PRODUCT_ID not set');
    }

    if (verifiedProductId) {
      try {
        const verifiedProduct = await stripe.products.retrieve(verifiedProductId);
        console.log('✅ Verified Product:', verifiedProduct.name);
      } catch (err) {
        console.log('❌ Verified Product not found:', verifiedProductId);
      }
    } else {
      console.log('⚠️  STRIPE_VERIFIED_PRODUCT_ID not set');
    }
    console.log();

    // Test 3: Verify prices exist
    console.log('Test 3: Verifying Stripe prices...');
    const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID;
    const verifiedPriceId = process.env.STRIPE_VERIFIED_PRICE_ID;

    if (basicPriceId) {
      try {
        const basicPrice = await stripe.prices.retrieve(basicPriceId);
        console.log('✅ Basic Price:', `$${basicPrice.unit_amount / 100} ${basicPrice.currency.toUpperCase()}`);
      } catch (err) {
        console.log('❌ Basic Price not found:', basicPriceId);
      }
    } else {
      console.log('⚠️  STRIPE_BASIC_PRICE_ID not set');
    }

    if (verifiedPriceId) {
      try {
        const verifiedPrice = await stripe.prices.retrieve(verifiedPriceId);
        console.log('✅ Verified Price:', `$${verifiedPrice.unit_amount / 100} ${verifiedPrice.currency.toUpperCase()}`);
      } catch (err) {
        console.log('❌ Verified Price not found:', verifiedPriceId);
      }
    } else {
      console.log('⚠️  STRIPE_VERIFIED_PRICE_ID not set');
    }
    console.log();

    // Test 4: List webhook endpoints
    console.log('Test 4: Listing webhook endpoints...');
    const webhookEndpoints = await stripe.webhookEndpoints.list({ limit: 10 });
    if (webhookEndpoints.data.length === 0) {
      console.log('⚠️  No webhook endpoints configured');
    } else {
      console.log(`✅ Found ${webhookEndpoints.data.length} webhook endpoint(s):`);
      webhookEndpoints.data.forEach((endpoint, index) => {
        console.log(`   ${index + 1}. ${endpoint.url}`);
        console.log(`      Status: ${endpoint.status}`);
        console.log(`      Events: ${endpoint.enabled_events.join(', ')}`);
      });
    }
    console.log();

    console.log('🎉 Stripe connection test completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Add webhook endpoint in Stripe Dashboard:');
    console.log('   - For local: Use Stripe CLI to forward to localhost:3000/api/webhooks/stripe');
    console.log('   - For production: https://eyes-ai-crm.vercel.app/api/webhooks/stripe');
    console.log('2. Update STRIPE_WEBHOOK_SECRET with the signing secret from Stripe');

  } catch (error) {
    console.error('❌ Error testing Stripe connection:', error.message);
    process.exit(1);
  }
}

testStripeConnection();
