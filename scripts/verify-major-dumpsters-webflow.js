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

async function verifyWebflowSync() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 MAJOR DUMPSTERS WEBFLOW SYNC VERIFICATION\n');
  console.log('='.repeat(80));

  // ===== 1. GET webflow_profile_id from database =====
  console.log('\n📊 1. CHECKING DATABASE\n');

  const { data: company } = await supabase
    .from('companies')
    .select('webflow_profile_id, profile_slug, webflow_slug')
    .eq('id', companyId)
    .single();

  if (!company?.webflow_profile_id) {
    console.log('❌ webflow_profile_id is NULL - profile not synced yet');
    console.log('   Run re-publish first!\n');
    return;
  }

  const profileId = company.webflow_profile_id;
  console.log(`   webflow_profile_id: ${profileId}`);
  console.log(`   profile_slug: ${company.profile_slug || 'NULL'}`);
  console.log(`   webflow_slug: ${company.webflow_slug || 'NULL'}`);

  // ===== 2. FETCH PROFILE AND CHECK GALLERY =====
  console.log('\n\n🖼️  2. PROFILE GALLERY FIELD\n');

  const profileRes = await fetch(
    `https://api.webflow.com/v2/collections/6919a7f067ba553645e406a6/items/${profileId}?cmsLocaleId=679ec3f3391e2c67439813b4`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );

  if (!profileRes.ok) {
    console.log(`   ❌ Failed to fetch profile: ${profileRes.status}`);
    const errorText = await profileRes.text();
    console.log(`   Error: ${errorText.substring(0, 200)}`);
  } else {
    const profileData = await profileRes.json();
    const gallery = profileData.fieldData?.gallery;

    if (!gallery || (Array.isArray(gallery) && gallery.length === 0)) {
      console.log('   ❌ GALLERY IS EMPTY/NULL');
    } else {
      console.log(`   ✅ Gallery has ${Array.isArray(gallery) ? gallery.length : 1} images`);
      console.log('\n   Gallery URLs:');
      if (Array.isArray(gallery)) {
        gallery.forEach((img, i) => {
          console.log(`   ${i + 1}. ${img.url || JSON.stringify(img)}`);
        });
      } else {
        console.log(`   ${gallery.url || JSON.stringify(gallery)}`);
      }
    }

    // Show a few other key fields
    console.log('\n   Other Profile Fields:');
    console.log(`   business-name: ${profileData.fieldData?.['business-name'] || 'EMPTY'}`);
    console.log(`   ai-summary: ${profileData.fieldData?.['ai-summary']?.substring(0, 60) || 'EMPTY'}...`);
    console.log(`   call-now-2: ${profileData.fieldData?.['call-now-2'] || 'EMPTY'}`);
    console.log(`   email: ${profileData.fieldData?.['email'] || 'EMPTY'}`);
  }

  // ===== 3. COUNT REVIEWS =====
  console.log('\n\n⭐ 3. REVIEWS COLLECTION\n');

  const reviewsRes = await fetch(
    `https://api.webflow.com/v2/collections/6917304967a914982fd205bc/items?cmsLocaleId=679ec3f3391e2c67439813b4`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );

  if (!reviewsRes.ok) {
    console.log(`   ❌ Failed to fetch reviews: ${reviewsRes.status}`);
  } else {
    const reviewsData = await reviewsRes.json();
    const profileReviews = reviewsData.items?.filter(r => r.fieldData?.profile === profileId) || [];

    console.log(`   Total reviews for this profile: ${profileReviews.length}`);

    if (profileReviews.length === 0) {
      console.log('   ❌ NO REVIEWS FOUND');
    } else {
      console.log('\n   Sample review:');
      const firstReview = profileReviews[0];
      console.log(`   name: ${firstReview.fieldData.name}`);
      console.log(`   review-text: ${firstReview.fieldData['review-text']?.substring(0, 80)}...`);
      console.log(`   review-source-company: ${firstReview.fieldData['review-source-company']}`);
    }
  }

  // ===== 4. CHECK SERVICE INCLUDED ITEMS =====
  console.log('\n\n🔧 4. SERVICES INCLUDED FIELDS\n');

  const servicesRes = await fetch(
    `https://api.webflow.com/v2/collections/691b7c75c939d316cb7f73b0/items?cmsLocaleId=679ec3f3391e2c67439813b4`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );

  if (!servicesRes.ok) {
    console.log(`   ❌ Failed to fetch services: ${servicesRes.status}`);
  } else {
    const servicesData = await servicesRes.json();
    const profileServices = servicesData.items?.filter(s => s.fieldData?.profile === profileId) || [];

    console.log(`   Total services for this profile: ${profileServices.length}`);

    if (profileServices.length === 0) {
      console.log('   ❌ NO SERVICES FOUND');
    } else {
      console.log('\n   First service:');
      const firstService = profileServices[0];
      console.log(`   name: ${firstService.fieldData.name}`);
      console.log(`   description: ${firstService.fieldData.description?.substring(0, 60)}...`);
      console.log(`   included1: "${firstService.fieldData.included1 || 'EMPTY'}"`);
      console.log(`   included2: "${firstService.fieldData.included2 || 'EMPTY'}"`);
      console.log(`   included3: "${firstService.fieldData.included3 || 'EMPTY'}"`);
      console.log(`   included4: "${firstService.fieldData.included4 || 'EMPTY'}"`);

      if (!firstService.fieldData.included1 && !firstService.fieldData.included2) {
        console.log('\n   ❌ INCLUDED ITEMS ARE EMPTY');
      } else {
        console.log('\n   ✅ INCLUDED ITEMS POPULATED');
      }
    }
  }

  // ===== 5. CHECK SERVICE REFERENCES (QUICK REFERENCE GUIDE) =====
  console.log('\n\n📊 5. SERVICES_REFERENCES (QUICK REFERENCE GUIDE)\n');

  const refsRes = await fetch(
    `https://api.webflow.com/v2/collections/69258b73b4aa5928c4949176/items?cmsLocaleId=679ec3f3391e2c67439813b4`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );

  if (!refsRes.ok) {
    console.log(`   ❌ Failed to fetch service references: ${refsRes.status}`);
  } else {
    const refsData = await refsRes.json();
    const profileRefs = refsData.items?.filter(r => r.fieldData?.profile === profileId) || [];

    console.log(`   Total service references: ${profileRefs.length}`);

    if (profileRefs.length === 0) {
      console.log('   ❌ NO SERVICE REFERENCES FOUND');
    } else {
      console.log('\n   Sample reference:');
      const firstRef = profileRefs[0];
      console.log(`   name: ${firstRef.fieldData.name}`);
      console.log(`   duration: ${firstRef.fieldData.duration}`);
      console.log(`   best-for: ${firstRef.fieldData['best-for']}`);
      console.log(`   price-range: ${firstRef.fieldData['price-range']}`);
      console.log('\n   ✅ QUICK REFERENCE GUIDE SYNCED');
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

verifyWebflowSync().catch(console.error);
