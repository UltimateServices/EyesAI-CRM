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

async function debugMajorDumpsters() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 Debug: Finding Major Dumpsters\n');

  // Try different search patterns
  const searches = [
    { pattern: '%major dumpsters%', label: 'major dumpsters (lowercase)' },
    { pattern: '%Major Dumpsters%', label: 'Major Dumpsters (title case)' },
    { pattern: '%MAJOR DUMPSTERS%', label: 'MAJOR DUMPSTERS (uppercase)' },
    { pattern: '%dumpsters%', label: 'dumpsters (any)' },
  ];

  for (const search of searches) {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, organization_id')
      .ilike('name', search.pattern)
      .limit(5);

    console.log(`Search: ${search.label}`);
    if (data && data.length > 0) {
      data.forEach(c => console.log(`  ✓ ${c.name} (${c.id})`));
    } else {
      console.log(`  ✗ No results`);
    }
    console.log('');
  }

  // Now get ALL companies and search manually
  console.log('🔍 Getting all companies and searching manually...\n');

  const { data: allCompanies } = await supabase
    .from('companies')
    .select('id, name')
    .limit(100);

  const matches = allCompanies?.filter(c =>
    c.name.toLowerCase().includes('major') ||
    c.name.toLowerCase().includes('dumpster')
  );

  console.log(`Found ${matches?.length || 0} matches:`);
  matches?.forEach(c => {
    console.log(`  - ${c.name} (${c.id})`);
  });

  if (matches && matches.length > 0) {
    const company = matches[0];
    console.log(`\n📋 Checking intakes for: ${company.name}\n`);

    // Check intakes
    const { data: intakes, error: intakeError } = await supabase
      .from('intakes')
      .select('id, company_id, created_at, updated_at')
      .eq('company_id', company.id);

    if (intakeError) {
      console.log(`❌ Error: ${intakeError.message}`);
    } else if (!intakes || intakes.length === 0) {
      console.log(`❌ No intakes found`);
    } else {
      console.log(`✅ Found ${intakes.length} intake(s):`);
      intakes.forEach(i => {
        console.log(`   ID: ${i.id}`);
        console.log(`   Created: ${i.created_at}`);
        console.log(`   Updated: ${i.updated_at}`);
        console.log('');
      });

      // Get the first intake with full data
      const { data: fullIntake } = await supabase
        .from('intakes')
        .select('*')
        .eq('id', intakes[0].id)
        .single();

      if (fullIntake?.roma_data) {
        const sections = Object.keys(fullIntake.roma_data);
        console.log(`📦 ROMA Data sections (${sections.length}):`);
        console.log(`   ${sections.join(', ')}\n`);

        // Count content
        const romaData = fullIntake.roma_data;
        const serviceCount = romaData.services_offered ? Object.keys(romaData.services_offered).filter(k => k.startsWith('service_')).length : 0;
        const faqCount = romaData.faqs ? Object.keys(romaData.faqs).filter(k => k.startsWith('faq_')).length : 0;
        const scenarioCount = romaData.scenarios_and_tips ? Object.keys(romaData.scenarios_and_tips).filter(k => k.startsWith('scenario_')).length : 0;
        const reviewCount = romaData.featured_reviews ? Object.keys(romaData.featured_reviews).filter(k => k.startsWith('review_')).length : 0;

        console.log(`📊 Content counts:`);
        console.log(`   Services: ${serviceCount}`);
        console.log(`   FAQs: ${faqCount}`);
        console.log(`   Scenarios: ${scenarioCount}`);
        console.log(`   Reviews: ${reviewCount}\n`);

        console.log(`🚀 Ready to test! Company ID: ${company.id}\n`);
      } else {
        console.log(`❌ No roma_data in intake\n`);
      }
    }
  }
}

debugMajorDumpsters().catch(console.error);
