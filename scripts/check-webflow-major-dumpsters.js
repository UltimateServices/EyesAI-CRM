const fs = require('fs');
const path = require('path');

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');

    for (const line of lines) {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    }
  } catch (err) {
    console.error('Error loading .env.local:', err.message);
  }
}

loadEnv();

async function checkWebflowMajorDumpsters() {
  const webflowToken = process.env.WEBFLOW_CMS_SITE_API_TOKEN;
  const PROFILES_COLLECTION = '6919a7f067ba553645e406a6';

  console.log('\n🔍 Checking Webflow profile for Major Dumpsters...\n');

  try {
    // Get all profiles
    const response = await fetch(`https://api.webflow.com/v2/collections/${PROFILES_COLLECTION}/items`, {
      headers: {
        'Authorization': `Bearer ${webflowToken}`,
        'accept': 'application/json'
      }
    });

    const result = await response.json();
    const majorDumpsters = result.items?.find(i => i.fieldData.slug?.includes('major-dumpsters'));

    if (!majorDumpsters) {
      console.log('❌ Major Dumpsters profile not found in Webflow');
      return;
    }

    console.log('✅ Found Major Dumpsters profile:\n');
    console.log(`   ID: ${majorDumpsters.id}`);
    console.log(`   Slug: ${majorDumpsters.fieldData.slug}\n`);

    console.log('📊 Field Values:\n');
    const fields = majorDumpsters.fieldData;

    // Check which fields have values
    const fieldKeys = Object.keys(fields).sort();
    fieldKeys.forEach(key => {
      const value = fields[key];
      if (value && value !== '' && value !== null && value !== undefined) {
        if (typeof value === 'object') {
          console.log(`  ✅ ${key}: ${JSON.stringify(value).substring(0, 80)}...`);
        } else {
          console.log(`  ✅ ${key}: ${String(value).substring(0, 80)}`);
        }
      } else {
        console.log(`  ❌ ${key}: EMPTY`);
      }
    });

    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWebflowMajorDumpsters().catch(console.error);
