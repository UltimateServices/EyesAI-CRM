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

async function checkMajorDumpstersReviews() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  console.log('\n🔍 Checking reviews for Major Dumpsters...\n');

  // Get intake data
  const { data: intake } = await supabase
    .from('intakes')
    .select('roma_data')
    .eq('company_id', companyId)
    .single();

  if (!intake || !intake.roma_data) {
    console.log('❌ No intake data found');
    return;
  }

  const rd = intake.roma_data;

  console.log('📦 ROMA Data - featured_reviews:\n');
  console.log(JSON.stringify(rd.featured_reviews, null, 2));

  if (rd.featured_reviews?.items && Array.isArray(rd.featured_reviews.items)) {
    console.log(`\n✅ Found ${rd.featured_reviews.items.length} reviews in roma_data\n`);

    console.log('Reviews to insert:\n');
    rd.featured_reviews.items.forEach((review, idx) => {
      console.log(`${idx + 1}. ${review.reviewer || 'Unknown'}`);
      console.log(`   Source: ${review.source || 'N/A'}`);
      console.log(`   Date: ${review.date || 'N/A'}`);
      console.log(`   Stars: ${review.stars || 'N/A'}`);
      console.log(`   Text: ${review.excerpt?.substring(0, 100) || 'N/A'}...`);
      console.log('');
    });
  } else {
    console.log('❌ No featured_reviews.items found');
  }

  // Check reviews table
  const { data: dbReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('company_id', companyId);

  console.log(`\n📊 Reviews table: ${dbReviews?.length || 0} reviews\n`);
}

checkMajorDumpstersReviews().catch(console.error);
