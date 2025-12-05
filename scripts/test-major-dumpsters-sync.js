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

async function testMajorDumpsters() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 Step 1: Finding Major Dumpsters...\n');

  // Use the correct Major Dumpsters ID (the one in onboarding)
  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .single();

  if (companyError || !company) {
    console.error('❌ Major Dumpsters not found');
    return;
  }
  console.log(`✅ Found: ${company.name}`);
  console.log(`   ID: ${company.id}\n`);

  // Get intake data
  console.log('📦 Step 2: Fetching intake roma_data...\n');

  const { data: intakes, error: intakeError } = await supabase
    .from('intakes')
    .select('id, company_id, roma_data')
    .eq('company_id', company.id);

  if (intakeError) {
    console.error('❌ Error fetching intake data');
    console.error('   Error:', intakeError?.message);
    return;
  }

  if (!intakes || intakes.length === 0) {
    console.error('❌ No intake data found for Major Dumpsters');
    console.error('   You need to paste intake data first using Step 2 in the onboarding flow');
    return;
  }

  const intake = intakes[0];
  if (intakes.length > 1) {
    console.log(`⚠️  Found ${intakes.length} intake records, using the first one`);
  }

  console.log(`✅ Intake ID: ${intake.id}`);
  console.log(`   Company ID: ${intake.company_id}`);

  if (intake.roma_data) {
    const sections = Object.keys(intake.roma_data);
    console.log(`   ROMA sections: ${sections.length}`);
    console.log(`   Sections: ${sections.join(', ')}\n`);

    // Show sample data from each section
    console.log('📋 Sample data from each section:\n');

    if (intake.roma_data.hero) {
      console.log('   HERO:');
      console.log(`     - business_name: ${intake.roma_data.hero.business_name}`);
      console.log(`     - tagline: ${intake.roma_data.hero.tagline}`);
    }

    if (intake.roma_data.services_offered) {
      const services = Object.keys(intake.roma_data.services_offered).filter(k => k.startsWith('service_'));
      console.log(`\n   SERVICES: ${services.length} services`);
      services.slice(0, 2).forEach(key => {
        const s = intake.roma_data.services_offered[key];
        console.log(`     - ${s.title || 'N/A'}`);
      });
    }

    if (intake.roma_data.faqs) {
      const faqs = Object.keys(intake.roma_data.faqs).filter(k => k.startsWith('faq_'));
      console.log(`\n   FAQS: ${faqs.length} FAQs`);
      faqs.slice(0, 2).forEach(key => {
        const f = intake.roma_data.faqs[key];
        console.log(`     - ${f.question || 'N/A'}`);
      });
    }

    if (intake.roma_data.scenarios_and_tips) {
      const scenarios = Object.keys(intake.roma_data.scenarios_and_tips).filter(k => k.startsWith('scenario_'));
      console.log(`\n   SCENARIOS: ${scenarios.length} scenarios`);
      scenarios.slice(0, 2).forEach(key => {
        const s = intake.roma_data.scenarios_and_tips[key];
        console.log(`     - ${s.heading || 'N/A'}`);
      });
    }

    if (intake.roma_data.featured_reviews) {
      const reviews = Object.keys(intake.roma_data.featured_reviews).filter(k => k.startsWith('review_'));
      console.log(`\n   REVIEWS: ${reviews.length} reviews`);
      reviews.slice(0, 2).forEach(key => {
        const r = intake.roma_data.featured_reviews[key];
        console.log(`     - ${r.reviewer || 'N/A'}: ${r.excerpt?.substring(0, 50) || 'N/A'}...`);
      });
    }

    if (intake.roma_data.locations_and_hours?.primary_location) {
      console.log(`\n   LOCATION:`);
      const loc = intake.roma_data.locations_and_hours.primary_location;
      console.log(`     - ${loc.street_address || 'N/A'}`);
      console.log(`     - ${loc.city || 'N/A'}, ${loc.state || 'N/A'} ${loc.zip || 'N/A'}`);
    }
  } else {
    console.log('   ❌ No roma_data found\n');
    return;
  }

  console.log('\n📝 To test the publish endpoint, run this curl command:\n');
  console.log(`curl -X POST http://64.225.63.17:3001/api/webflow/publish-company \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"companyId": "${company.id}"}'`);
  console.log('');
}

testMajorDumpsters().catch(console.error);
