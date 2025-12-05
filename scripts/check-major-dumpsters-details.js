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

const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

async function checkDetails() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n📊 Major Dumpsters Details Check\n');

  // Check company record
  const { data: company } = await supabase
    .from('companies')
    .select('id, business_name, profile_slug, webflow_profile_id')
    .eq('id', companyId)
    .single();

  console.log('COMPANY RECORD:');
  console.log(`  business_name: ${company?.business_name}`);
  console.log(`  profile_slug: ${company?.profile_slug || 'NULL'}`);
  console.log(`  webflow_profile_id: ${company?.webflow_profile_id || 'NULL'}`);

  // Check media items
  const { data: media } = await supabase
    .from('media_items')
    .select('id, media_type, file_path, webflow_image_url')
    .eq('company_id', companyId);

  console.log('\nMEDIA ITEMS:');
  media?.forEach((m, i) => {
    console.log(`  ${i + 1}. media_type: "${m.media_type || 'NULL'}"`);
    console.log(`     file_path: ${m.file_path?.substring(0, 60)}...`);
    console.log(`     webflow_image_url: ${m.webflow_image_url || 'NULL'}`);
  });

  console.log('');
}

checkDetails().catch(console.error);
