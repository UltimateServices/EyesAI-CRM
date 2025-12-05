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

async function checkReviewStatus() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  console.log('\n🔍 Checking review status in database...\n');

  // Check ALL reviews for this company
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('company_id', companyId);

  console.log(`Total reviews: ${allReviews?.length || 0}\n`);

  if (allReviews && allReviews.length > 0) {
    allReviews.forEach((review, idx) => {
      console.log(`${idx + 1}. ${review.author || 'Unknown'}`);
      console.log(`   Status: ${review.status}`);
      console.log(`   Platform: ${review.platform || 'N/A'}`);
      console.log(`   Rating: ${review.rating || 'N/A'}`);
      console.log(`   Date: ${review.date || 'N/A'}`);
      console.log(`   Text: ${review.text?.substring(0, 80) || 'N/A'}...`);
      console.log('');
    });
  }

  // Check active only
  const { data: activeReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active');

  console.log(`\n✅ Active reviews: ${activeReviews?.length || 0}\n`);
}

checkReviewStatus().catch(console.error);
