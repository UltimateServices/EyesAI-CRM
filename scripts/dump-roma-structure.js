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

async function dumpRomaStructure() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Use Zoroco as it has complete data
  const companyId = '02a7ab6c-78ca-49bb-9d80-1e1ed42e510f';

  const { data: intake } = await supabase
    .from('intakes')
    .select('roma_data')
    .eq('company_id', companyId)
    .single();

  if (!intake || !intake.roma_data) {
    console.log('No data');
    return;
  }

  const rd = intake.roma_data;

  console.log('\n=== HERO ===');
  console.log(JSON.stringify(rd.hero, null, 2));

  console.log('\n=== ABOUT_AND_BADGES ===');
  console.log(JSON.stringify(rd.about_and_badges, null, 2));

  console.log('\n=== AI_OVERVIEW ===');
  console.log(JSON.stringify(rd.ai_overview, null, 2));

  console.log('\n=== SERVICES (first 2) ===');
  if (Array.isArray(rd.services)) {
    console.log(JSON.stringify(rd.services.slice(0, 2), null, 2));
  }

  console.log('\n=== FAQS ===');
  console.log(JSON.stringify(rd.faqs, null, 2));

  console.log('\n=== WHAT_TO_EXPECT ===');
  console.log(JSON.stringify(rd.what_to_expect, null, 2));

  console.log('\n=== LOCATIONS_AND_HOURS ===');
  console.log(JSON.stringify(rd.locations_and_hours, null, 2));

  console.log('\n=== FEATURED_REVIEWS ===');
  console.log(JSON.stringify(rd.featured_reviews, null, 2));

  console.log('\n=== SEO_AND_SCHEMA ===');
  console.log(JSON.stringify(rd.seo_and_schema, null, 2));

  console.log('\n=== GET_IN_TOUCH ===');
  console.log(JSON.stringify(rd.get_in_touch, null, 2));

  console.log('\n=== FOOTER ===');
  console.log(JSON.stringify(rd.footer, null, 2));

  console.log('\n=== PRICING_INFORMATION ===');
  console.log(JSON.stringify(rd.pricing_information, null, 2));
}

dumpRomaStructure().catch(console.error);
