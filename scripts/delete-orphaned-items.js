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

async function deleteOrphanedItems() {
  console.log('\n🗑️  Deleting orphaned Major Dumpsters items\n');

  const slugPrefix = 'major-dumpsters-ea5eb06d';

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
    const orphanedItems = data.items?.filter(item =>
      item.fieldData?.slug?.startsWith(slugPrefix)
    ) || [];

    console.log(`${name}: Found ${orphanedItems.length} items with slug prefix "${slugPrefix}"`);

    for (const item of orphanedItems) {
      console.log(`  Deleting: ${item.fieldData.slug}`);
      await fetch(`https://api.webflow.com/v2/collections/${id}/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${WEBFLOW_TOKEN}`
        }
      });
    }
    console.log(`  ✅ Deleted ${orphanedItems.length} ${name}\n`);
  }

  console.log('✅ Cleanup complete!\n');
}

deleteOrphanedItems().catch(console.error);
