// Test script to verify Webflow API access
// Load environment variables from .env file manually
const fs = require('fs');
const path = require('path');

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

console.log('🔍 Testing Webflow CMS Connection...\n');
console.log('Configuration:');
console.log('- Site ID:', WEBFLOW_SITE_ID);
console.log('- Token:', WEBFLOW_TOKEN ? `${WEBFLOW_TOKEN.substring(0, 10)}...` : '❌ NOT SET');
console.log('');

async function testWebflowConnection() {
  if (!WEBFLOW_TOKEN) {
    console.error('❌ WEBFLOW_CMS_SITE_API_TOKEN is not set in .env file');
    process.exit(1);
  }

  try {
    // Test 1: Get site info
    console.log('📡 Test 1: Fetching site info...');
    const siteResponse = await fetch(`https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    });

    if (!siteResponse.ok) {
      const errorText = await siteResponse.text();
      console.error(`❌ Site fetch failed (${siteResponse.status}):`, errorText);
      return;
    }

    const siteData = await siteResponse.json();
    console.log('✅ Site found:', siteData.displayName || siteData.name);
    console.log('   Site ID:', siteData.id);
    console.log('');

    // Test 2: List collections
    console.log('📡 Test 2: Fetching collections...');
    const collectionsResponse = await fetch(`https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/collections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    });

    if (!collectionsResponse.ok) {
      const errorText = await collectionsResponse.text();
      console.error(`❌ Collections fetch failed (${collectionsResponse.status}):`, errorText);
      return;
    }

    const collectionsData = await collectionsResponse.json();
    console.log(`✅ Found ${collectionsData.collections?.length || 0} collections:`);

    if (collectionsData.collections) {
      collectionsData.collections.forEach((collection) => {
        console.log(`   - ${collection.displayName} (ID: ${collection.id})`);
      });
    }
    console.log('');

    // Test 3: Try to fetch Profiles collection items
    const profilesCollectionId = '6919a7f067ba553645e406a6';
    console.log('📡 Test 3: Fetching items from Profiles collection...');

    const itemsResponse = await fetch(`https://api.webflow.com/v2/collections/${profilesCollectionId}/items`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    });

    if (!itemsResponse.ok) {
      const errorText = await itemsResponse.text();
      console.error(`❌ Items fetch failed (${itemsResponse.status}):`, errorText);
      return;
    }

    const itemsData = await itemsResponse.json();
    console.log(`✅ Found ${itemsData.items?.length || 0} items in Profiles collection`);

    if (itemsData.items && itemsData.items.length > 0) {
      console.log('   First item:', itemsData.items[0].fieldData?.name || 'Unnamed');
    }
    console.log('');

    console.log('🎉 All tests passed! Webflow API connection is working.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testWebflowConnection();
