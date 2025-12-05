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

async function inspectRomaData() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 INSPECTING MAJOR DUMPSTERS ROMA_DATA\n');
  console.log('='.repeat(80));

  const { data: intake } = await supabase
    .from('intakes')
    .select('roma_data')
    .eq('company_id', companyId)
    .single();

  if (!intake?.roma_data) {
    console.log('❌ NO ROMA_DATA FOUND');
    return;
  }

  const rd = intake.roma_data;

  // ===== SERVICES STRUCTURE =====
  console.log('\n📦 SERVICES STRUCTURE\n');
  console.log(`Type: ${Array.isArray(rd.services) ? 'ARRAY' : typeof rd.services}`);

  if (rd.services && typeof rd.services === 'object' && !Array.isArray(rd.services)) {
    console.log('Keys:', Object.keys(rd.services).slice(0, 5).join(', '));

    if (rd.services.service_1) {
      console.log('\nservice_1 structure:');
      console.log('  title:', rd.services.service_1.title);
      console.log('  included_1:', rd.services.service_1.included_1);
      console.log('  included_2:', rd.services.service_1.included_2);
      console.log('  included_3:', rd.services.service_1.included_3);
      console.log('  included_4:', rd.services.service_1.included_4);
      console.log('  All keys:', Object.keys(rd.services.service_1).join(', '));
    }
  } else if (Array.isArray(rd.services)) {
    console.log('Count:', rd.services.length);
    if (rd.services[0]) {
      console.log('First service keys:', Object.keys(rd.services[0]).join(', '));
    }
  }

  // ===== FAQS STRUCTURE =====
  console.log('\n\n❓ FAQS STRUCTURE\n');
  console.log(`Type: ${Array.isArray(rd.faqs) ? 'ARRAY' : typeof rd.faqs}`);

  if (rd.faqs && typeof rd.faqs === 'object') {
    console.log('Keys:', Object.keys(rd.faqs).slice(0, 10).join(', '));

    if (rd.faqs.faq_1) {
      console.log('\nfaq_1 structure:');
      console.log('  question:', rd.faqs.faq_1.question);
      console.log('  answer:', rd.faqs.faq_1.answer?.substring(0, 60));
      console.log('  All keys:', Object.keys(rd.faqs.faq_1).join(', '));
    }
  }

  // ===== SCENARIOS (what_to_expect) STRUCTURE =====
  console.log('\n\n📋 SCENARIOS (what_to_expect) STRUCTURE\n');
  console.log(`Type: ${Array.isArray(rd.what_to_expect) ? 'ARRAY' : typeof rd.what_to_expect}`);

  if (rd.what_to_expect && typeof rd.what_to_expect === 'object') {
    console.log('Keys:', Object.keys(rd.what_to_expect).slice(0, 5).join(', '));

    if (rd.what_to_expect.scenario_1) {
      console.log('\nscenario_1 structure:');
      console.log('  title:', rd.what_to_expect.scenario_1.title);
      console.log('  All keys:', Object.keys(rd.what_to_expect.scenario_1).join(', '));
    }
  } else if (Array.isArray(rd.what_to_expect)) {
    console.log('Count:', rd.what_to_expect.length);
  }

  // ===== LOCATIONS STRUCTURE =====
  console.log('\n\n📍 LOCATIONS STRUCTURE\n');

  if (rd.locations_and_hours?.locations) {
    console.log('Format: NEW (locations_and_hours.locations[])');
    console.log('Count:', rd.locations_and_hours.locations.length);
  } else if (rd.locations?.location_1) {
    console.log('Format: OLD (locations.location_1)');
    console.log('location_1 structure:');
    console.log('  address_1:', rd.locations.location_1.address_1);
    console.log('  address_2:', rd.locations.location_1.address_2);
    console.log('  All keys:', Object.keys(rd.locations.location_1).join(', '));
  } else {
    console.log('❌ NO LOCATIONS FOUND');
  }

  // ===== REVIEWS =====
  console.log('\n\n⭐ REVIEWS IN ROMA_DATA\n');

  if (rd.featured_reviews) {
    console.log('featured_reviews found');
    console.log('Keys:', Object.keys(rd.featured_reviews).slice(0, 5).join(', '));
  } else {
    console.log('❌ NO featured_reviews in roma_data');
  }

  // Check database reviews
  const { data: dbReviews } = await supabase
    .from('reviews')
    .select('id, author, text')
    .eq('company_id', companyId);

  console.log(`\nDatabase reviews table: ${dbReviews?.length || 0} reviews`);
  if (dbReviews && dbReviews.length > 0) {
    console.log('First review author:', dbReviews[0].author);
  }

  // ===== PHOTO_GALLERY =====
  console.log('\n\n🖼️  PHOTO_GALLERY STRUCTURE\n');

  if (rd.photo_gallery) {
    console.log('photo_gallery found');
    console.log('Keys:', Object.keys(rd.photo_gallery).slice(0, 10).join(', '));

    if (rd.photo_gallery.image_1) {
      console.log('\nimage_1:');
      console.log('  url:', rd.photo_gallery.image_1.url?.substring(0, 70));
      console.log('  alt:', rd.photo_gallery.image_1.alt?.substring(0, 60));
    }
  } else {
    console.log('❌ NO photo_gallery found');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

inspectRomaData().catch(console.error);
