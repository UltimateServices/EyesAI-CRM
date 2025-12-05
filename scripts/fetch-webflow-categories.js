// Fetch all categories from Webflow CMS to get the correct IDs
// Set these from your .env.local file
const WEBFLOW_API_TOKEN = process.env.WEBFLOW_CMS_SITE_API_TOKEN;
const WEBFLOW_SITE_ID = '68db778020fc2ac5c78f401a';

// Find the categories collection ID - we need to look for it in collections
async function fetchCategories() {
  try {
    // First, get all collections to find the categories collection
    console.log('Fetching Webflow collections...\n');
    const collectionsResponse = await fetch(
      `https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/collections`,
      {
        headers: {
          'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
          'accept': 'application/json'
        }
      }
    );

    if (!collectionsResponse.ok) {
      const error = await collectionsResponse.text();
      throw new Error(`Failed to fetch collections: ${error}`);
    }

    const collectionsData = await collectionsResponse.json();
    console.log('All collections:');
    collectionsData.collections.forEach(col => {
      console.log(`  - ${col.displayName} (ID: ${col.id})`);
    });

    // Find the categories collection
    const categoriesCollection = collectionsData.collections.find(
      col => col.displayName.toLowerCase().includes('categor') ||
             col.slug.toLowerCase().includes('categor')
    );

    if (!categoriesCollection) {
      console.log('\n❌ No categories collection found. Available collections:');
      collectionsData.collections.forEach(col => {
        console.log(`  - ${col.displayName} (slug: ${col.slug})`);
      });
      return;
    }

    console.log(`\n✅ Found categories collection: ${categoriesCollection.displayName} (ID: ${categoriesCollection.id})\n`);

    // Now fetch all items from the categories collection
    const itemsResponse = await fetch(
      `https://api.webflow.com/v2/collections/${categoriesCollection.id}/items`,
      {
        headers: {
          'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
          'accept': 'application/json'
        }
      }
    );

    if (!itemsResponse.ok) {
      const error = await itemsResponse.text();
      throw new Error(`Failed to fetch category items: ${error}`);
    }

    const itemsData = await itemsResponse.json();

    console.log(`\n📋 Categories (${itemsData.items.length} total):\n`);

    // Create a mapping object
    const mapping = {};
    itemsData.items.forEach(item => {
      const name = item.fieldData.name || item.fieldData.title || item.fieldData.slug;
      console.log(`  "${name}": "${item.id}",`);
      mapping[name] = item.id;
    });

    console.log('\n\n✅ Copy this mapping to your code:\n');
    console.log('const categoryMapping: Record<string, string> = {');
    Object.entries(mapping).forEach(([name, id]) => {
      console.log(`  '${name}': '${id}',`);
    });
    console.log('};');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fetchCategories();
