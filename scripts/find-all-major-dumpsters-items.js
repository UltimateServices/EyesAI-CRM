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

async function findAllMajorDumpstersItems() {
  console.log('\n🔍 FINDING ALL MAJOR DUMPSTERS ITEMS (INCLUDING DRAFT/ARCHIVED)\n');
  console.log('='.repeat(80));

  const collections = {
    SERVICES: '691b7c75c939d316cb7f73b0',
    REVIEWS: '6917304967a914982fd205bc',
  };

  for (const [name, id] of Object.entries(collections)) {
    console.log(`\n${name} Collection:`);

    // Fetch ALL items without filters
    const res = await fetch(`https://api.webflow.com/v2/collections/${id}/items?limit=100`, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    });

    const data = await res.json();
    console.log(`  Total items in API response: ${data.items?.length || 0}`);

    // Filter for Major Dumpsters (any slug containing "major" or "dumpster")
    const majorDumpstersItems = data.items?.filter(item =>
      item.fieldData?.slug?.toLowerCase().includes('major') ||
      item.fieldData?.slug?.toLowerCase().includes('dumpster')
    ) || [];

    console.log(`\n  Major Dumpsters items found: ${majorDumpstersItems.length}`);

    if (majorDumpstersItems.length > 0) {
      majorDumpstersItems.forEach((item, i) => {
        console.log(`  ${i + 1}. slug: "${item.fieldData.slug}"`);
        console.log(`      id: ${item.id}`);
        console.log(`      isDraft: ${item.isDraft}`);
        console.log(`      isArchived: ${item.isArchived}`);
        console.log('');
      });
    }
  }

  console.log('='.repeat(80) + '\n');
}

findAllMajorDumpstersItems().catch(console.error);
