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

async function inspectZoroco() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const companyId = '02a7ab6c-78ca-49bb-9d80-1e1ed42e510f'; // Zoroco Packaging

  const { data: intake } = await supabase
    .from('intakes')
    .select('roma_data')
    .eq('company_id', companyId)
    .single();

  if (!intake || !intake.roma_data) {
    console.log('No data');
    return;
  }

  const romaData = intake.roma_data;

  console.log('\n📦 ROMA Data Structure for Zoroco Packaging:\n');
  console.log('Sections:', Object.keys(romaData).join(', '));
  console.log('\n');

  // Show full structure
  console.log(JSON.stringify(romaData, null, 2));
}

inspectZoroco().catch(console.error);
