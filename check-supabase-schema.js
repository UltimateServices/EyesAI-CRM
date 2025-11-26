// Check Supabase companies table schema to ensure all fields exist
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

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Supabase Database Schema...\n');

// Fields we need for Webflow sync
const REQUIRED_FIELDS = {
  // Core fields
  'id': 'UUID',
  'organization_id': 'UUID',
  'name': 'TEXT',

  // Contact info
  'website': 'TEXT',
  'phone': 'TEXT',
  'email': 'TEXT',
  'address': 'TEXT',
  'city': 'TEXT',
  'state': 'TEXT',
  'zip': 'TEXT',

  // Business info
  'tagline': 'TEXT',
  'about': 'TEXT',
  'ai_summary': 'TEXT',
  'status': 'TEXT',
  'plan': 'TEXT',

  // Social media
  'facebook_url': 'TEXT',
  'instagram_url': 'TEXT',  // MIGHT BE MISSING
  'youtube_url': 'TEXT',     // MIGHT BE MISSING

  // Images
  'logo_url': 'TEXT',
  'media_gallery': 'JSONB',  // MIGHT BE MISSING

  // Platform links
  'google_maps_url': 'TEXT',
  'yelp_url': 'TEXT',

  // Webflow sync tracking
  'webflow_published': 'BOOLEAN',
  'webflow_slug': 'TEXT',
  'last_synced_at': 'TIMESTAMP',

  // Timestamps
  'created_at': 'TIMESTAMP',
  'updated_at': 'TIMESTAMP',
};

async function checkSchema() {
  try {
    // Fetch a sample company to see what columns exist
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?limit=1`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Failed to fetch companies:', response.status, response.statusText);
      return;
    }

    const data = await response.json();

    if (data.length === 0) {
      console.log('⚠️  No companies in database. Cannot check schema.');
      console.log('   Add at least one company first, then run this script again.');
      return;
    }

    const sampleCompany = data[0];
    const existingFields = Object.keys(sampleCompany);

    console.log('✅ Found sample company:', sampleCompany.name);
    console.log(`\n📊 Checking ${Object.keys(REQUIRED_FIELDS).length} required fields...\n`);

    const missing = [];
    const present = [];

    for (const [field, type] of Object.entries(REQUIRED_FIELDS)) {
      if (existingFields.includes(field)) {
        present.push(field);
        console.log(`   ✅ ${field} (${type})`);
      } else {
        missing.push({ field, type });
        console.log(`   ❌ ${field} (${type}) - MISSING`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY');
    console.log('='.repeat(80));
    console.log(`   Present: ${present.length}/${Object.keys(REQUIRED_FIELDS).length}`);
    console.log(`   Missing: ${missing.length}`);

    if (missing.length > 0) {
      console.log('\n❌ MISSING FIELDS - You need to add these columns:');
      console.log('\nSQL Migration:');
      console.log('```sql');
      console.log('ALTER TABLE companies');
      missing.forEach((m, i) => {
        const comma = i < missing.length - 1 ? ',' : ';';
        console.log(`  ADD COLUMN IF NOT EXISTS ${m.field} ${m.type}${comma}`);
      });
      console.log('```');
    } else {
      console.log('\n✅ All required fields are present! Your schema is ready for Webflow sync.');
    }

    // Also show actual columns in database
    console.log('\n📝 ACTUAL COLUMNS IN DATABASE:');
    existingFields.sort().forEach(field => {
      const value = sampleCompany[field];
      const valueType = value === null ? 'null' : typeof value;
      console.log(`   - ${field} (${valueType})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
