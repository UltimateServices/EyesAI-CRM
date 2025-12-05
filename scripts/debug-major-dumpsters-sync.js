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

async function debugMajorDumpsters() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 DIAGNOSTIC REPORT: Major Dumpsters Sync Issues\n');
  console.log('=' .repeat(70));

  // ===== 1. CHECK REVIEWS =====
  console.log('\n📋 1. REVIEWS ANALYSIS\n');

  // Check database reviews
  const { data: dbReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('company_id', companyId);

  console.log(`   Database Reviews: ${dbReviews?.length || 0} found`);
  if (dbReviews && dbReviews.length > 0) {
    console.log(`   Sample review: ${dbReviews[0].author} - ${dbReviews[0].rating}★`);
  }

  // Get profile slug from company
  const { data: company } = await supabase
    .from('companies')
    .select('profile_slug')
    .eq('id', companyId)
    .single();

  const profileSlug = company?.profile_slug;
  console.log(`\n   Profile slug: ${profileSlug}`);

  // Fetch profile from Webflow
  const profileRes = await fetch(
    `https://api.webflow.com/v2/collections/6919a7f067ba553645e406a6/items?cmsLocaleId=679ec3f3391e2c67439813b4`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );
  const profileData = await profileRes.json();
  const profile = profileData.items?.find(p => p.fieldData?.slug === profileSlug);

  if (!profile) {
    console.log(`   ❌ Profile not found in Webflow with slug: ${profileSlug}`);
  } else {
    console.log(`   ✅ Profile found in Webflow: ${profile.id}`);

    // Fetch reviews from Webflow
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
    const profileReviews = reviewsData.items?.filter(r => r.fieldData?.profile === profile.id) || [];

    console.log(`   Webflow Reviews: ${profileReviews.length} synced`);
    if (profileReviews.length > 0) {
      console.log(`   Sample: ${profileReviews[0].fieldData.name} - ${profileReviews[0].fieldData['review-source-company']}`);
    } else {
      console.log(`   ❌ NO REVIEWS FOUND IN WEBFLOW`);
    }
  }

  // ===== 2. CHECK GALLERY =====
  console.log('\n\n🖼️  2. GALLERY ANALYSIS\n');

  // Check database media
  const { data: dbMedia } = await supabase
    .from('media_items')
    .select('*')
    .eq('company_id', companyId);

  console.log(`   Database Media: ${dbMedia?.length || 0} items`);
  if (dbMedia) {
    const galleryMedia = dbMedia.filter(m => m.media_type === 'gallery');
    const logoMedia = dbMedia.filter(m => m.media_type === 'logo');
    console.log(`   - Logos: ${logoMedia.length}`);
    console.log(`   - Gallery: ${galleryMedia.length}`);
    if (galleryMedia.length > 0) {
      console.log(`   Sample gallery URL: ${galleryMedia[0].webflow_image_url || galleryMedia[0].file_path}`);
    }
  }

  // Check what's in Webflow profile
  if (profile) {
    const gallery = profile.fieldData?.gallery;
    console.log(`\n   Webflow Profile Gallery Field:`);
    if (!gallery || (Array.isArray(gallery) && gallery.length === 0)) {
      console.log(`   ❌ GALLERY IS EMPTY`);
    } else {
      console.log(`   ✅ Gallery has ${Array.isArray(gallery) ? gallery.length : 1} images`);
      console.log(`   Gallery value:`, JSON.stringify(gallery, null, 2).substring(0, 300));
    }

    const profileImage = profile.fieldData?.['profile-image'];
    console.log(`\n   Webflow Profile Image Field:`);
    if (!profileImage) {
      console.log(`   ❌ PROFILE IMAGE IS EMPTY`);
    } else {
      console.log(`   ✅ Profile image exists`);
      console.log(`   Value:`, JSON.stringify(profileImage, null, 2).substring(0, 200));
    }
  }

  // ===== 3. CHECK SERVICES INCLUDED =====
  console.log('\n\n🔧 3. SERVICES INCLUDED ANALYSIS\n');

  // Check roma_data services structure
  const { data: intake } = await supabase
    .from('intakes')
    .select('roma_data')
    .eq('company_id', companyId)
    .single();

  if (intake?.roma_data?.services) {
    const services = intake.roma_data.services;

    if (Array.isArray(services)) {
      console.log(`   ROMA Structure: ARRAY (${services.length} services)`);
      if (services[0]) {
        console.log(`   First service has whats_included:`, !!services[0].whats_included);
        if (services[0].whats_included) {
          console.log(`   whats_included:`, services[0].whats_included);
        }
        console.log(`   First service has included_1:`, !!services[0].included_1);
        if (services[0].included_1) {
          console.log(`   included_1-4:`, [
            services[0].included_1,
            services[0].included_2,
            services[0].included_3,
            services[0].included_4
          ]);
        }
      }
    } else {
      console.log(`   ROMA Structure: OBJECT (OLD format)`);
      if (services.service_1) {
        console.log(`   service_1 has whats_included:`, !!services.service_1.whats_included);
        if (services.service_1.whats_included) {
          console.log(`   whats_included:`, services.service_1.whats_included);
        }
        console.log(`   service_1 has included_1:`, !!services.service_1.included_1);
        if (services.service_1.included_1) {
          console.log(`   included_1-4:`, [
            services.service_1.included_1,
            services.service_1.included_2,
            services.service_1.included_3,
            services.service_1.included_4
          ]);
        }

        console.log(`\n   Full service_1 keys:`);
        console.log(`   `, Object.keys(services.service_1).join(', '));
      }
    }
  }

  // Fetch services from Webflow
  if (profile) {
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
    const profileServices = servicesData.items?.filter(s => s.fieldData?.profile === profile.id) || [];

    console.log(`\n   Webflow Services: ${profileServices.length} synced`);
    if (profileServices.length > 0) {
      const firstService = profileServices[0];
      console.log(`\n   First service: ${firstService.fieldData.name}`);
      console.log(`   included1: "${firstService.fieldData.included1 || ''}"`);
      console.log(`   included2: "${firstService.fieldData.included2 || ''}"`);
      console.log(`   included3: "${firstService.fieldData.included3 || ''}"`);
      console.log(`   included4: "${firstService.fieldData.included4 || ''}"`);

      if (!firstService.fieldData.included1 && !firstService.fieldData.included2) {
        console.log(`   ❌ INCLUDED ITEMS ARE EMPTY`);
      }
    } else {
      console.log(`   ❌ NO SERVICES FOUND IN WEBFLOW`);
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

debugMajorDumpsters().catch(console.error);
