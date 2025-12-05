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

async function debugMajorDumpstersStructure() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  console.log('\n🔍 Debugging Major Dumpsters ROMA structure...\n');

  const { data: intake } = await supabase
    .from('intakes')
    .select('roma_data')
    .eq('company_id', companyId)
    .single();

  if (!intake || !intake.roma_data) {
    console.log('❌ No roma_data found');
    return;
  }

  const rd = intake.roma_data;

  console.log('📦 Top-level sections:\n');
  Object.keys(rd).forEach(key => {
    console.log(`  - ${key}`);
  });

  // Check services structure
  console.log('\n🔧 SERVICES:\n');
  if (rd.services) {
    console.log(`  Type: ${Array.isArray(rd.services) ? 'ARRAY' : 'OBJECT'}`);
    if (Array.isArray(rd.services)) {
      console.log(`  Count: ${rd.services.length}`);
      console.log(`  First item keys: ${Object.keys(rd.services[0] || {}).join(', ')}`);
      console.log(`  Sample:`, JSON.stringify(rd.services[0], null, 2).substring(0, 300));
    } else {
      console.log(`  Keys: ${Object.keys(rd.services).join(', ')}`);
    }
  } else {
    console.log('  ❌ services NOT FOUND');
  }

  // Check FAQs structure
  console.log('\n❓ FAQS:\n');
  if (rd.faqs) {
    console.log(`  Type: ${Array.isArray(rd.faqs) ? 'ARRAY' : 'OBJECT'}`);
    console.log(`  Keys: ${Object.keys(rd.faqs).join(', ')}`);
    if (rd.faqs.all_questions) {
      console.log(`  all_questions keys: ${Object.keys(rd.faqs.all_questions).join(', ')}`);
      const firstCategory = Object.keys(rd.faqs.all_questions)[0];
      if (firstCategory) {
        const category = rd.faqs.all_questions[firstCategory];
        console.log(`  First category (${firstCategory}): ${Array.isArray(category) ? category.length + ' items' : 'NOT ARRAY'}`);
      }
    }
  } else {
    console.log('  ❌ faqs NOT FOUND');
  }

  // Check scenarios structure
  console.log('\n📋 SCENARIOS (what_to_expect):\n');
  if (rd.what_to_expect) {
    console.log(`  Type: ${Array.isArray(rd.what_to_expect) ? 'ARRAY' : 'OBJECT'}`);
    if (Array.isArray(rd.what_to_expect)) {
      console.log(`  Count: ${rd.what_to_expect.length}`);
      console.log(`  First item keys: ${Object.keys(rd.what_to_expect[0] || {}).join(', ')}`);
    }
  } else {
    console.log('  ❌ what_to_expect NOT FOUND');
  }

  // Check locations structure
  console.log('\n📍 LOCATIONS:\n');
  if (rd.locations_and_hours) {
    console.log(`  Keys: ${Object.keys(rd.locations_and_hours).join(', ')}`);
    if (rd.locations_and_hours.primary_location) {
      console.log(`  primary_location keys: ${Object.keys(rd.locations_and_hours.primary_location).join(', ')}`);
    }
  } else if (rd.locations) {
    console.log(`  Found 'locations' instead of 'locations_and_hours'`);
    console.log(`  Type: ${Array.isArray(rd.locations) ? 'ARRAY' : 'OBJECT'}`);
  } else {
    console.log('  ❌ locations_and_hours NOT FOUND');
  }

  console.log('');
}

debugMajorDumpstersStructure().catch(console.error);
