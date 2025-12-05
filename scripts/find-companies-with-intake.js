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

async function findCompaniesWithIntake() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 Finding companies with intake data...\n');

  // Get all intakes with their company info
  const { data: intakes, error } = await supabase
    .from('intakes')
    .select(`
      id,
      company_id,
      roma_data,
      companies (
        id,
        name
      )
    `)
    .not('roma_data', 'is', null)
    .limit(10);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!intakes || intakes.length === 0) {
    console.log('❌ No companies found with intake data');
    return;
  }

  console.log(`✅ Found ${intakes.length} companies with intake data:\n`);

  for (const intake of intakes) {
    const company = intake.companies;
    const romaData = intake.roma_data;
    const sections = romaData ? Object.keys(romaData).length : 0;

    console.log(`📋 ${company?.name || 'Unknown'}`);
    console.log(`   Company ID: ${intake.company_id}`);
    console.log(`   Intake ID: ${intake.id}`);
    console.log(`   ROMA sections: ${sections}`);

    if (romaData) {
      // Count services, FAQs, scenarios, reviews
      const serviceCount = romaData.services_offered ? Object.keys(romaData.services_offered).filter(k => k.startsWith('service_')).length : 0;
      const faqCount = romaData.faqs ? Object.keys(romaData.faqs).filter(k => k.startsWith('faq_')).length : 0;
      const scenarioCount = romaData.scenarios_and_tips ? Object.keys(romaData.scenarios_and_tips).filter(k => k.startsWith('scenario_')).length : 0;
      const reviewCount = romaData.featured_reviews ? Object.keys(romaData.featured_reviews).filter(k => k.startsWith('review_')).length : 0;

      console.log(`   Content: ${serviceCount} services, ${faqCount} FAQs, ${scenarioCount} scenarios, ${reviewCount} reviews`);
    }
    console.log('');
  }

  if (intakes.length > 0) {
    const firstIntake = intakes[0];
    const company = firstIntake.companies;

    console.log(`\n📝 To test with "${company?.name}", use this company ID:`);
    console.log(`   ${firstIntake.company_id}\n`);
  }
}

findCompaniesWithIntake().catch(console.error);
