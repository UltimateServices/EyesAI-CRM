/**
 * Test Klaviyo Email Integration
 *
 * This script tests all email flows in the EyesAI CRM:
 * 1. Checkout Link Requested (after form submission)
 * 2. Profile is Live (after Webflow publish)
 *
 * Usage:
 *   node test-klaviyo-emails.js checkout roma@deduxer.studio
 *   node test-klaviyo-emails.js profile-live roma@deduxer.studio
 *   node test-klaviyo-emails.js all roma@deduxer.studio
 */

// Load environment variables manually from .env file
const fs = require('fs');
const path = require('path');

let KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;

if (!KLAVIYO_API_KEY) {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/KLAVIYO_API_KEY=(.+)/);
    if (match) {
      KLAVIYO_API_KEY = match[1].trim();
    }
  } catch (err) {
    // Ignore if .env doesn't exist
  }
}

if (!KLAVIYO_API_KEY) {
  console.error('❌ Error: KLAVIYO_API_KEY not found in .env file');
  process.exit(1);
}

const emailType = process.argv[2];
const recipientEmail = process.argv[3];

if (!emailType || !recipientEmail) {
  console.log('Usage: node test-klaviyo-emails.js <type> <email>');
  console.log('Types: checkout, profile-live, all');
  console.log('Example: node test-klaviyo-emails.js all roma@deduxer.studio');
  process.exit(1);
}

// ============================================
// Test 1: Checkout Link Requested
// ============================================
async function testCheckoutEmail(email) {
  console.log('\n📧 Testing "Checkout Link Requested" email...');
  console.log(`   Recipient: ${email}`);

  try {
    // Step 1: Create/update profile
    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15',
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email: email,
            properties: {
              company_name: 'Test Company',
              selected_plan: 'DISCOVER',
              plan_price: 39,
            },
          },
        },
      }),
    });

    let profileId;
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      if (profileResponse.status === 409 && errorData.errors?.[0]?.code === 'duplicate_profile') {
        profileId = errorData.errors[0].meta.duplicate_profile_id;
        console.log('   ✅ Using existing profile:', profileId);
      } else {
        throw new Error(`Profile creation failed: ${JSON.stringify(errorData)}`);
      }
    } else {
      const profileData = await profileResponse.json();
      profileId = profileData.data.id;
      console.log('   ✅ Profile created:', profileId);
    }

    // Step 2: Trigger event
    const eventResponse = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
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
              company_name: 'Test Company',
              checkout_url: 'https://checkout.stripe.com/test/c/pay/cs_test_example123',
              plan_name: 'DISCOVER',
              plan_price: '$39',
              expires_in: '24 hours',
            },
            time: new Date().toISOString(),
          },
        },
      }),
    });

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      throw new Error(`Event trigger failed: ${errorText}`);
    }

    console.log('   ✅ Event triggered: "Checkout Link Requested"');
    console.log('   📬 Check your email at:', email);
    console.log('   ⚠️  Note: You must create a Flow in Klaviyo triggered by "Checkout Link Requested" event');
    return true;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

// ============================================
// Test 2: Profile is Live
// ============================================
async function testProfileLiveEmail(email) {
  console.log('\n📧 Testing "Profile is Live" email...');
  console.log(`   Recipient: ${email}`);

  try {
    // Step 1: Create/update profile
    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15',
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email: email,
            properties: {
              company_name: 'Test Company',
              package_type: 'DISCOVER',
            },
          },
        },
      }),
    });

    let profileId;
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      if (profileResponse.status === 409 && errorData.errors?.[0]?.code === 'duplicate_profile') {
        profileId = errorData.errors[0].meta.duplicate_profile_id;
        console.log('   ✅ Using existing profile:', profileId);
      } else {
        throw new Error(`Profile creation failed: ${JSON.stringify(errorData)}`);
      }
    } else {
      const profileData = await profileResponse.json();
      profileId = profileData.data.id;
      console.log('   ✅ Profile created:', profileId);
    }

    // Step 2: Trigger event
    const eventResponse = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
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
                  name: 'Profile is Live',
                },
              },
            },
            properties: {
              company_name: 'Test Company',
              profile_url: 'https://eyesai.ai/profile/test-company-abc123',
              package_type: 'DISCOVER',
            },
            time: new Date().toISOString(),
          },
        },
      }),
    });

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      throw new Error(`Event trigger failed: ${errorText}`);
    }

    console.log('   ✅ Event triggered: "Profile is Live"');
    console.log('   📬 Check your email at:', email);
    console.log('   ⚠️  Note: You must create a Flow in Klaviyo triggered by "Profile is Live" event');
    return true;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

// ============================================
// Main
// ============================================
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('🧪 Testing Klaviyo Email Integration');
  console.log('═══════════════════════════════════════════════');
  console.log(`API Key: ${KLAVIYO_API_KEY.substring(0, 10)}...`);

  let success = true;

  if (emailType === 'checkout' || emailType === 'all') {
    success = await testCheckoutEmail(recipientEmail) && success;
  }

  if (emailType === 'profile-live' || emailType === 'all') {
    success = await testProfileLiveEmail(recipientEmail) && success;
  }

  console.log('\n═══════════════════════════════════════════════');
  if (success) {
    console.log('✅ All tests completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check Klaviyo for the triggered events');
    console.log('2. Create Flows in Klaviyo for each event:');
    console.log('   - "Checkout Link Requested" flow');
    console.log('   - "Profile is Live" flow');
    console.log(`3. Check ${recipientEmail} for test emails`);
  } else {
    console.log('❌ Some tests failed. Check errors above.');
    process.exit(1);
  }
}

main();
