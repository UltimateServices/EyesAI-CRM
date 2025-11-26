// Test script to push a fake profile to Webflow CMS
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const WEBFLOW_SITE_ID = envVars.WEBFLOW_SITE_ID || '68db778020fc2ac5c78f401a';
const WEBFLOW_TOKEN = envVars.WEBFLOW_CMS_SITE_API_TOKEN;
const PROFILES_COLLECTION_ID = '6919a7f067ba553645e406a6';

console.log('🚀 Pushing Test Profile to Webflow CMS...\n');

// Generate a unique test profile
const timestamp = Date.now();
const testProfile = {
  fieldData: {
    // Required fields
    name: `Test Business ${timestamp}`,
    slug: `test-business-${timestamp}`,

    // Profile info
    'business-name': `Test Business ${timestamp}`,
    'social-handle': `@testbiz${timestamp}`,
    'short-description': 'This is a test business profile created via API for testing purposes.',

    // Contact info
    city: 'San Francisco',
    state: 'CA',
    'visit-website-2': 'https://testbusiness.example.com',
    'call-now-2': '+15550100',
    email: `contact-${timestamp}@testbusiness.com`,

    // Visibility settings
    spotlight: true,  // Show in directory
    directory: true,  // Show in spotlight

    // Package type (must be 'discover' or 'verified')
    'package-type': 'verified',

    // Additional details
    'about-description': 'A comprehensive test business profile with all details filled in for testing the API integration.',
    'pricing-information': 'Contact us for pricing details.'
  }
};

console.log('Test Profile Data:');
console.log(JSON.stringify(testProfile, null, 2));
console.log('');

async function pushProfile() {
  if (!WEBFLOW_TOKEN) {
    console.error('❌ WEBFLOW_CMS_SITE_API_TOKEN is not set in .env file');
    process.exit(1);
  }

  try {
    console.log('📡 Creating profile in Webflow CMS...');

    const createResponse = await fetch(
      `https://api.webflow.com/v2/collections/${PROFILES_COLLECTION_ID}/items`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(testProfile)
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`❌ Failed to create profile (${createResponse.status}):`, errorText);
      return;
    }

    const createdItem = await createResponse.json();
    console.log('✅ Profile created successfully!');
    console.log('   Item ID:', createdItem.id);
    console.log('   Name:', createdItem.fieldData?.name);
    console.log('   Slug:', createdItem.fieldData?.slug);
    console.log('');

    // Now publish the item
    console.log('📡 Publishing profile...');

    const publishResponse = await fetch(
      `https://api.webflow.com/v2/collections/${PROFILES_COLLECTION_ID}/items/publish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          itemIds: [createdItem.id]
        })
      }
    );

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error(`❌ Failed to publish profile (${publishResponse.status}):`, errorText);
      console.log('   Note: Profile was created but not published. You can publish it manually in Webflow CMS.');
      return;
    }

    const publishResult = await publishResponse.json();
    console.log('✅ Profile published successfully!');
    console.log('');
    console.log('🎉 Test complete! Check your Webflow CMS:');
    console.log(`   https://webflow.com/dashboard/sites/${WEBFLOW_SITE_ID}/cms/collection/${PROFILES_COLLECTION_ID}`);
    console.log('');
    console.log('💡 Profile should now be live on your website!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

pushProfile();
