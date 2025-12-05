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

async function verifyMajorDumpstersData() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 Step 1: Finding Major Dumpsters company...\n');

  // Find Major Dumpsters - use the correct one from onboarding
  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .single();

  if (!company) {
    console.error('❌ Company not found');
    return;
  }

  console.log(`✅ Company: ${company.name}`);
  console.log(`   ID: ${company.id}\n`);

  // Check roma_data (intakes)
  console.log('📦 Step 2: Checking intakes table (roma_data)...\n');

  const { data: intake } = await supabase
    .from('intakes')
    .select('id, company_id, created_at')
    .eq('company_id', companyId)
    .single();

  if (intake) {
    console.log(`✅ Intake exists:`);
    console.log(`   ID: ${intake.id}`);
    console.log(`   Created: ${intake.created_at}`);

    // Get full intake to check sections
    const { data: fullIntake } = await supabase
      .from('intakes')
      .select('roma_data')
      .eq('id', intake.id)
      .single();

    if (fullIntake?.roma_data) {
      const sections = Object.keys(fullIntake.roma_data);
      console.log(`   Sections: ${sections.length} (${sections.join(', ')})`);
    }
  } else {
    console.log('❌ No intake found');
  }

  // Check reviews table
  console.log('\n⭐ Step 3: Checking reviews table...\n');

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, author, platform, status')
    .eq('company_id', companyId);

  if (reviews && reviews.length > 0) {
    console.log(`✅ Reviews: ${reviews.length} total`);
    const activeReviews = reviews.filter(r => r.status === 'active');
    console.log(`   Active: ${activeReviews.length}`);
    activeReviews.slice(0, 3).forEach(r => {
      console.log(`   - ${r.author} (${r.platform})`);
    });
  } else {
    console.log('❌ No reviews found');
  }

  // Check media_items table
  console.log('\n🖼️  Step 4: Checking media_items table...\n');

  const { data: mediaItems } = await supabase
    .from('media_items')
    .select('id, file_url, internal_tags, status')
    .eq('company_id', companyId);

  if (mediaItems && mediaItems.length > 0) {
    console.log(`✅ Media items: ${mediaItems.length} total`);
    const activeMedia = mediaItems.filter(m => m.status === 'active');
    console.log(`   Active: ${activeMedia.length}`);

    const logos = activeMedia.filter(m => m.internal_tags?.includes('logo'));
    const gallery = activeMedia.filter(m => !m.internal_tags?.includes('logo'));

    console.log(`   Logos: ${logos.length}`);
    if (logos.length > 0) {
      logos.forEach(l => {
        console.log(`     - ${l.file_url}`);
      });
    }

    console.log(`   Gallery: ${gallery.length}`);
    if (gallery.length > 0) {
      gallery.slice(0, 3).forEach(g => {
        console.log(`     - ${g.file_url}`);
      });
    }
  } else {
    console.log('❌ No media items found');
  }

  console.log('\n✅ Data verification complete!\n');
  console.log(`Company ID for publish: ${company.id}\n`);
}

verifyMajorDumpstersData().catch(console.error);
