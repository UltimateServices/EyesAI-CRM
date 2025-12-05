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

async function dumpMajorDumpstersSections() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  console.log('\n🔍 Dumping Major Dumpsters sections...\n');

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

  console.log('=== HERO ===');
  console.log(JSON.stringify(rd.hero, null, 2));

  console.log('\n=== ABOUT ===');
  console.log(JSON.stringify(rd.about, null, 2));

  console.log('\n=== ABOUT_AND_BADGES ===');
  console.log(JSON.stringify(rd.about_and_badges, null, 2));

  console.log('\n=== CONTACT ===');
  console.log(JSON.stringify(rd.contact, null, 2));

  console.log('\n=== GET_IN_TOUCH ===');
  console.log(JSON.stringify(rd.get_in_touch, null, 2));

  console.log('\n=== FOOTER ===');
  console.log(JSON.stringify(rd.footer, null, 2));

  console.log('\n=== PRICING_INFORMATION ===');
  console.log(JSON.stringify(rd.pricing_information, null, 2));

  console.log('\n=== SERVICES.SERVICE_1 ===');
  console.log(JSON.stringify(rd.services?.service_1, null, 2));

  console.log('\n=== SEO_SCHEMA ===');
  console.log(JSON.stringify(rd.seo_schema, null, 2));

  console.log('');
}

dumpMajorDumpstersSections().catch(console.error);
