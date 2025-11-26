// Get schemas for Blogs, Services, and Videos collections
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

const WEBFLOW_TOKEN = envVars.WEBFLOW_CMS_SITE_API_TOKEN;

const collections = {
  'Blogs': '6924108f80f9c5582bc96d73',
  'Videos': '692411de97b9276613a4ccb7',
  'Services': '691b7c75c939d316cb7f73b0'
};

console.log('🔍 Fetching Collection Schemas...\n');

async function getSchema(name, collectionId) {
  try {
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${collectionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch ${name} schema (${response.status}):`, errorText);
      return;
    }

    const collection = await response.json();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 ${name} Collection`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Collection ID: ${collection.id}`);
    console.log(`Display Name: ${collection.displayName}`);
    console.log(`\nFields:\n`);

    collection.fields.forEach((field) => {
      console.log(`Field: ${field.slug}`);
      console.log(`  Display Name: ${field.displayName}`);
      console.log(`  Type: ${field.type}`);
      console.log(`  Required: ${field.isRequired || false}`);

      if (field.validations) {
        if (field.validations.options) {
          console.log(`  Options: ${field.validations.options.map(o => o.name || o.id).join(', ')}`);
        }
        if (field.validations.collectionId) {
          console.log(`  References Collection: ${field.validations.collectionId}`);
        }
      }
      console.log('');
    });

  } catch (error) {
    console.error(`❌ Error fetching ${name}:`, error.message);
  }
}

async function getAllSchemas() {
  for (const [name, id] of Object.entries(collections)) {
    await getSchema(name, id);
  }
}

getAllSchemas();
