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

async function deleteMajorDumpstersItems() {
  console.log('\n🗑️  Finding and Deleting Major Dumpsters Items\n');
  console.log('='.repeat(80));

  const collections = {
    SERVICES: '691b7c75c939d316cb7f73b0',
    REVIEWS: '6917304967a914982fd205bc',
  };

  for (const [name, id] of Object.entries(collections)) {
    console.log(`\n${name} Collection:`);

    const res = await fetch(`https://api.webflow.com/v2/collections/${id}/items`, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    });

    const data = await res.json();
    console.log(`  Total items: ${data.items?.length || 0}`);

    // Show ALL items (not just first 10)
    if (data.items && data.items.length > 0) {
      console.log('\n  All items:');
      data.items.forEach((item, i) => {
        console.log(`  ${i + 1}. slug: "${item.fieldData?.slug}", isDraft: ${item.isDraft}, isArchived: ${item.isArchived}`);
      });
    }

    // Find Major Dumpsters items (containing "major-dumpsters" in slug)
    const majorDumpstersItems = data.items?.filter(item =>
      item.fieldData?.slug?.includes('major-dumpsters')
    ) || [];

    console.log(`\n  Found ${majorDumpstersItems.length} Major Dumpsters items to delete:`);

    for (const item of majorDumpstersItems) {
      console.log(`  Deleting: ${item.fieldData.slug} (isDraft: ${item.isDraft}, isArchived: ${item.isArchived})`);

      const deleteRes = await fetch(`https://api.webflow.com/v2/collections/${id}/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${WEBFLOW_TOKEN}`
        }
      });

      if (deleteRes.ok) {
        console.log(`    ✅ Deleted`);
      } else {
        const errorText = await deleteRes.text();
        console.log(`    ❌ Failed: ${errorText}`);
      }
    }

    console.log(`  ✅ Deleted ${majorDumpstersItems.length} ${name}\n`);
  }

  console.log('='.repeat(80));
  console.log('✅ Cleanup complete!\n');
}

deleteMajorDumpstersItems().catch(console.error);
