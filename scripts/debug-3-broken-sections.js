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
const profileId = '692c985b909809252a48d820';

async function debug3BrokenSections() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 DEBUGGING 3 BROKEN SECTIONS: Gallery, Reviews, Services Included\n');
  console.log('='.repeat(80));

  // ===== 1. GALLERY =====
  console.log('\n🖼️  1. GALLERY\n');

  const profileRes = await fetch(
    `https://api.webflow.com/v2/collections/6919a7f067ba553645e406a6/items/${profileId}`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );

  const profileData = await profileRes.json();
  const gallery = profileData.fieldData?.gallery;

  console.log('WEBFLOW PROFILE gallery field:');
  if (!gallery) {
    console.log('  ❌ NULL');
  } else if (Array.isArray(gallery) && gallery.length === 0) {
    console.log('  ❌ EMPTY ARRAY');
  } else if (Array.isArray(gallery)) {
    console.log(`  ✅ ${gallery.length} images`);
    gallery.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.url?.substring(0, 70)}...`);
    });
  } else {
    console.log('  Value:', JSON.stringify(gallery, null, 2));
  }

  // Check roma_data source
  const { data: intake } = await supabase
    .from('intakes')
    .select('roma_data')
    .eq('company_id', companyId)
    .single();

  const rd = intake.roma_data;

  console.log('\nROMA_DATA SOURCE (photo_gallery):');
  if (rd.photo_gallery) {
    let validImages = 0;
    for (let i = 1; i <= 15; i++) {
      const img = rd.photo_gallery[`image_${i}`];
      if (img && img.url && img.url !== '<>') {
        validImages++;
        if (validImages <= 3) {
          console.log(`  ${validImages}. ${img.url.substring(0, 70)}...`);
        }
      }
    }
    console.log(`  Total valid images: ${validImages}`);
  } else {
    console.log('  ❌ NO photo_gallery in roma_data');
  }

  // Check media_items
  const { data: mediaItems } = await supabase
    .from('media_items')
    .select('file_url, category, internal_tags')
    .eq('company_id', companyId)
    .eq('status', 'active');

  console.log('\nMEDIA_ITEMS TABLE:');
  console.log(`  Total: ${mediaItems?.length || 0}`);
  if (mediaItems && mediaItems.length > 0) {
    mediaItems.forEach((item, i) => {
      console.log(`  ${i + 1}. category: "${item.category || 'NULL'}", tags: ${JSON.stringify(item.internal_tags)}`);
    });
  }

  // ===== 2. REVIEWS =====
  console.log('\n\n⭐ 2. REVIEWS\n');

  const reviewsRes = await fetch(
    `https://api.webflow.com/v2/collections/6917304967a914982fd205bc/items`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );

  const reviewsData = await reviewsRes.json();
  const profileReviews = reviewsData.items?.filter(r => r.fieldData?.profile === profileId) || [];

  console.log('WEBFLOW REVIEWS COLLECTION:');
  console.log(`  Count for this profile: ${profileReviews.length}`);
  if (profileReviews.length > 0) {
    console.log('\n  First review:');
    const r = profileReviews[0].fieldData;
    console.log(`  name: "${r.name}"`);
    console.log(`  review-text: "${r['review-text']?.substring(0, 60)}..."`);
    console.log(`  review-source-company: "${r['review-source-company']}"`);
  } else {
    console.log('  ❌ NO REVIEWS FOUND');
  }

  // Check database source
  const { data: dbReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('company_id', companyId);

  console.log('\nDATABASE reviews TABLE:');
  console.log(`  Count: ${dbReviews?.length || 0}`);
  if (dbReviews && dbReviews.length > 0) {
    console.log('\n  First review:');
    console.log(`  author: "${dbReviews[0].author}"`);
    console.log(`  text: "${dbReviews[0].text?.substring(0, 60)}..."`);
    console.log(`  platform: "${dbReviews[0].platform}"`);
    console.log(`  rating: ${dbReviews[0].rating}`);
  }

  // ===== 3. SERVICES INCLUDED =====
  console.log('\n\n🔧 3. SERVICES "WHAT\'S INCLUDED"\n');

  const servicesRes = await fetch(
    `https://api.webflow.com/v2/collections/691b7c75c939d316cb7f73b0/items`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );

  const servicesData = await servicesRes.json();
  const profileServices = servicesData.items?.filter(s => s.fieldData?.profile === profileId) || [];

  console.log('WEBFLOW SERVICES COLLECTION:');
  console.log(`  Count for this profile: ${profileServices.length}`);

  if (profileServices.length === 0) {
    console.log('  ❌ NO SERVICES FOUND');
  } else {
    profileServices.forEach((service, i) => {
      const s = service.fieldData;
      console.log(`\n  Service ${i + 1}: "${s.name}"`);
      console.log(`  included1: "${s.included1 || 'EMPTY'}"`);
      console.log(`  included2: "${s.included2 || 'EMPTY'}"`);
      console.log(`  included3: "${s.included3 || 'EMPTY'}"`);
      console.log(`  included4: "${s.included4 || 'EMPTY'}"`);

      if (!s.included1 && !s.included2 && !s.included3 && !s.included4) {
        console.log('  ❌ ALL INCLUDED ITEMS ARE EMPTY');
      }
    });
  }

  // Check roma_data source
  console.log('\nROMA_DATA SOURCE (services):');
  if (rd.services && rd.services.service_1) {
    console.log(`  service_1 title: "${rd.services.service_1.title}"`);
    console.log(`  included_1: "${rd.services.service_1.included_1}"`);
    console.log(`  included_2: "${rd.services.service_1.included_2}"`);
    console.log(`  included_3: "${rd.services.service_1.included_3}"`);
    console.log(`  included_4: "${rd.services.service_1.included_4}"`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

debug3BrokenSections().catch(console.error);
