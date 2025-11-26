// Get the Profiles collection schema to see available fields
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

console.log('🔍 Fetching Profiles Collection Schema...\n');

async function getSchema() {
  try {
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${PROFILES_COLLECTION_ID}`,
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
      console.error(`❌ Failed to fetch schema (${response.status}):`, errorText);
      return;
    }

    const collection = await response.json();

    console.log('Collection Name:', collection.displayName);
    console.log('Collection ID:', collection.id);
    console.log('\n📋 Available Fields:\n');

    collection.fields.forEach((field) => {
      console.log(`Field: ${field.slug}`);
      console.log(`  Display Name: ${field.displayName}`);
      console.log(`  Type: ${field.type}`);
      console.log(`  Required: ${field.isRequired || false}`);

      if (field.validations) {
        if (field.validations.options) {
          console.log(`  Options: ${field.validations.options.map(o => o.name || o.id).join(', ')}`);
        }
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getSchema();
