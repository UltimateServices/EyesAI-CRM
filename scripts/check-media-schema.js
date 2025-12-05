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

async function checkMediaSchema() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  console.log('\n🔍 Checking media_items table schema...\n');

  // Get one media item to see all columns
  const { data: mediaItem, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('company_id', companyId)
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (mediaItem) {
    console.log('📋 Available columns in media_items table:\n');
    const columns = Object.keys(mediaItem);
    columns.forEach(col => {
      console.log(`  - ${col}: ${typeof mediaItem[col]} = ${JSON.stringify(mediaItem[col])?.substring(0, 50)}`);
    });
  }

  console.log('');
}

checkMediaSchema().catch(console.error);
