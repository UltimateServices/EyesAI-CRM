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

const WEBFLOW_TOKEN = process.env.WEBFLOW_CMS_SITE_API_TOKEN;
const profileId = '692c985b909809252a48d820'; // Major Dumpsters profile

async function checkGallery() {
  console.log('\n🖼️  Checking Major Dumpsters Profile Gallery Field\n');
  console.log('='.repeat(80));

  const profileRes = await fetch(
    `https://api.webflow.com/v2/collections/6919a7f067ba553645e406a6/items/${profileId}`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );

  const profileData = await profileRes.json();
  const gallery = profileData.fieldData?.gallery;

  console.log('\nWebflow Profile ID:', profileId);
  console.log('\nGallery field value:');

  if (!gallery) {
    console.log('  ❌ NULL/UNDEFINED');
  } else if (Array.isArray(gallery) && gallery.length === 0) {
    console.log('  ❌ EMPTY ARRAY');
  } else if (Array.isArray(gallery)) {
    console.log(`  ✅ ${gallery.length} images`);
    gallery.forEach((img, i) => {
      console.log(`\n  Image ${i + 1}:`);
      console.log(`    URL: ${img.url}`);
      console.log(`    Alt: ${img.alt || 'N/A'}`);
      console.log(`    fileId: ${img.fileId || 'N/A'}`);
    });
  } else {
    console.log('  Unknown type:', typeof gallery);
    console.log('  Value:', JSON.stringify(gallery, null, 2));
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

checkGallery().catch(console.error);
