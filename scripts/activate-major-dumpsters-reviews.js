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

async function activateReviews() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  console.log('\n🔄 Activating reviews for Major Dumpsters...\n');

  // Update all reviews to status='active'
  const { data, error } = await supabase
    .from('reviews')
    .update({ status: 'active' })
    .eq('company_id', companyId)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Updated ${data?.length || 0} reviews to status='active'\n`);

  if (data && data.length > 0) {
    data.forEach((review, idx) => {
      console.log(`${idx + 1}. ${review.author} - NOW ACTIVE`);
    });
  }

  console.log('\n✅ Done! Reviews are now ready for Step 5 publish.\n');
}

activateReviews().catch(console.error);
