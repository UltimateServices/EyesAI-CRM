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

async function listAll() {
  console.log('\n📋 Listing ALL services and reviews\n');

  const collections = {
    SERVICES: '691b7c75c939d316cb7f73b0',
    REVIEWS: '6917304967a914982fd205bc',
  };

  for (const [name, id] of Object.entries(collections)) {
    const res = await fetch(`https://api.webflow.com/v2/collections/${id}/items`, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    });

    const data = await res.json();
    console.log(`${name}: ${data.items?.length || 0} total items`);

    if (data.items && data.items.length > 0) {
      data.items.slice(0, 10).forEach((item, i) => {
        console.log(`  ${i + 1}. slug: "${item.fieldData?.slug}", isDraft: ${item.isDraft}, isArchived: ${item.isArchived}`);
      });
    }
    console.log('');
  }
}

listAll().catch(console.error);
