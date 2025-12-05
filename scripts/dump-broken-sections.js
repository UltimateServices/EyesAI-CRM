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

const WEBFLOW_TOKEN = process.env.WEBFLOW_CMS_SITE_API_TOKEN;
const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

async function dumpBrokenSections() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 MAJOR DUMPSTERS - 4 BROKEN SECTIONS DIAGNOSTIC\n');
  console.log('='.repeat(80));

  // Get roma_data
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

  // ===== 1. SERVICES INCLUDED ITEMS =====
  console.log('\n📦 1. SERVICES INCLUDED ITEMS\n');
  console.log('services.service_1:');
  console.log(JSON.stringify(rd.services?.service_1, null, 2));

  // ===== 2. QUICK REFERENCE GUIDE =====
  console.log('\n\n📊 2. QUICK REFERENCE GUIDE / SERVICE COMPARISON\n');

  // Check all possible locations
  const possibleKeys = [
    'quick_reference_guide',
    'service_comparison',
    'service_reference',
    'services_reference',
    'service_grid',
    'comparison_table'
  ];

  let found = false;
  for (const key of possibleKeys) {
    if (rd[key]) {
      console.log(`Found: ${key}`);
      console.log(JSON.stringify(rd[key], null, 2));
      found = true;
      break;
    }
  }

  if (!found) {
    console.log('❌ No quick reference guide section found');
    console.log('\nAll top-level keys in roma_data:');
    console.log(Object.keys(rd).join(', '));
  }

  // ===== 3. REVIEWS =====
  console.log('\n\n⭐ 3. REVIEWS\n');

  const reviewKeys = ['featured_reviews', 'reviews', 'testimonials', 'customer_reviews'];
  let reviewsFound = false;
  for (const key of reviewKeys) {
    if (rd[key]) {
      console.log(`Found: ${key}`);
      console.log(JSON.stringify(rd[key], null, 2));
      reviewsFound = true;
      break;
    }
  }

  if (!reviewsFound) {
    console.log('❌ No reviews section found in roma_data');
  }

  // Check database reviews
  const { data: dbReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('company_id', companyId);

  console.log(`\n✅ Database reviews table: ${dbReviews?.length || 0} reviews found`);
  if (dbReviews && dbReviews.length > 0) {
    console.log('Sample:');
    console.log(JSON.stringify(dbReviews[0], null, 2));
  }

  // ===== 4. GALLERY =====
  console.log('\n\n🖼️  4. GALLERY\n');

  const galleryKeys = [
    'gallery',
    'hero.gallery_images',
    'hero.gallery',
    'media.gallery',
    'images',
    'photo_gallery'
  ];

  let galleryFound = false;
  for (const key of galleryKeys) {
    const parts = key.split('.');
    let value = rd;
    for (const part of parts) {
      value = value?.[part];
    }
    if (value) {
      console.log(`Found: ${key}`);
      console.log(JSON.stringify(value, null, 2));
      galleryFound = true;
      break;
    }
  }

  if (!galleryFound) {
    console.log('❌ No gallery section found in roma_data');
  }

  // Check database media
  const { data: dbMedia } = await supabase
    .from('media_items')
    .select('*')
    .eq('company_id', companyId);

  console.log(`\n✅ Database media_items table: ${dbMedia?.length || 0} items found`);
  if (dbMedia && dbMedia.length > 0) {
    console.log('Sample:');
    console.log(JSON.stringify(dbMedia[0], null, 2));
  }

  console.log('\n' + '='.repeat(80));

  // ===== WEBFLOW CHECK =====
  console.log('\n🌐 WEBFLOW SYNC STATUS CHECK\n');
  console.log('='.repeat(80));

  // Get company details
  const { data: company } = await supabase
    .from('companies')
    .select('webflow_profile_id, profile_slug')
    .eq('id', companyId)
    .single();

  console.log(`\nCompany webflow_profile_id: ${company?.webflow_profile_id || 'NULL'}`);
  console.log(`Company profile_slug: ${company?.profile_slug || 'NULL'}`);

  if (!company?.webflow_profile_id) {
    console.log('\n❌ Cannot check Webflow - no webflow_profile_id');
    return;
  }

  const profileId = company.webflow_profile_id;

  // Check Reviews in Webflow
  console.log('\n\n1️⃣ REVIEWS COLLECTION:');
  const reviewsRes = await fetch(
    `https://api.webflow.com/v2/collections/6917304967a914982fd205bc/items?cmsLocaleId=679ec3f3391e2c67439813b4`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );
  const reviewsData = await reviewsRes.json();
  const profileReviews = reviewsData.items?.filter(r => r.fieldData?.profile === profileId) || [];
  console.log(`   Synced: ${profileReviews.length} reviews`);

  // Check Services References in Webflow
  console.log('\n2️⃣ SERVICES_REFERENCES COLLECTION:');
  const refsRes = await fetch(
    `https://api.webflow.com/v2/collections/69258b73b4aa5928c4949176/items?cmsLocaleId=679ec3f3391e2c67439813b4`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );
  const refsData = await refsRes.json();
  const profileRefs = refsData.items?.filter(r => r.fieldData?.profile === profileId) || [];
  console.log(`   Synced: ${profileRefs.length} service references`);

  // Check Profile Gallery
  console.log('\n3️⃣ PROFILE GALLERY FIELD:');
  const profileRes = await fetch(
    `https://api.webflow.com/v2/collections/6919a7f067ba553645e406a6/items/${profileId}?cmsLocaleId=679ec3f3391e2c67439813b4`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );
  const profileData = await profileRes.json();
  const gallery = profileData.fieldData?.gallery;
  console.log(`   Gallery value: ${gallery ? JSON.stringify(gallery, null, 2) : 'NULL/EMPTY'}`);

  // Check Services Included
  console.log('\n4️⃣ SERVICES INCLUDED FIELDS:');
  const servicesRes = await fetch(
    `https://api.webflow.com/v2/collections/691b7c75c939d316cb7f73b0/items?cmsLocaleId=679ec3f3391e2c67439813b4`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );
  const servicesData = await servicesRes.json();
  const profileServices = servicesData.items?.filter(s => s.fieldData?.profile === profileId) || [];
  console.log(`   Synced: ${profileServices.length} services`);
  if (profileServices.length > 0) {
    const first = profileServices[0];
    console.log(`   First service: "${first.fieldData.name}"`);
    console.log(`   included1: "${first.fieldData.included1 || 'EMPTY'}"`);
    console.log(`   included2: "${first.fieldData.included2 || 'EMPTY'}"`);
    console.log(`   included3: "${first.fieldData.included3 || 'EMPTY'}"`);
    console.log(`   included4: "${first.fieldData.included4 || 'EMPTY'}"`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

dumpBrokenSections().catch(console.error);
