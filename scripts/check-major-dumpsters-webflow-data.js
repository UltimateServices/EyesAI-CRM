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
const profileId = '692c985b909809252a48d820'; // Major Dumpsters profile

async function checkWebflowData() {
  console.log('\n🔍 CHECKING MAJOR DUMPSTERS DATA IN WEBFLOW\n');
  console.log('='.repeat(80));

  // ===== 1. CHECK REVIEWS =====
  console.log('\n⭐ 1. REVIEWS COLLECTION\n');

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
  const majorDumpstersReviews = reviewsData.items?.filter(r =>
    r.fieldData?.profile === profileId
  ) || [];

  console.log(`Total reviews in collection: ${reviewsData.items?.length || 0}`);
  console.log(`Major Dumpsters reviews: ${majorDumpstersReviews.length}`);

  if (majorDumpstersReviews.length > 0) {
    console.log('\n✅ REVIEWS EXIST IN WEBFLOW:\n');
    majorDumpstersReviews.forEach((review, i) => {
      const r = review.fieldData;
      console.log(`  ${i + 1}. "${r.name}" - ${r['review-source-company']}`);
      console.log(`      Slug: ${r.slug}`);
      console.log(`      Text: ${r['review-text']?.substring(0, 60)}...`);
      console.log(`      isDraft: ${review.isDraft}, isArchived: ${review.isArchived}`);
      console.log('');
    });
  } else {
    console.log('\n❌ NO REVIEWS FOUND FOR MAJOR DUMPSTERS');
    console.log('   This is a SYNC ISSUE - reviews need to be created in Webflow');
  }

  // ===== 2. CHECK GALLERY =====
  console.log('\n🖼️  2. PROFILE GALLERY FIELD\n');

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

  console.log(`Profile ID: ${profileId}`);
  console.log(`Profile slug: ${profileData.fieldData?.slug || 'N/A'}`);

  if (!gallery) {
    console.log('\n❌ GALLERY FIELD IS NULL/UNDEFINED');
    console.log('   This is a SYNC ISSUE - gallery images need to be synced to Webflow');
  } else if (Array.isArray(gallery) && gallery.length === 0) {
    console.log('\n❌ GALLERY FIELD IS EMPTY ARRAY');
    console.log('   This is a SYNC ISSUE - gallery images need to be synced to Webflow');
  } else if (Array.isArray(gallery)) {
    console.log(`\n✅ GALLERY HAS ${gallery.length} IMAGES IN WEBFLOW:\n`);
    gallery.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.url?.substring(0, 70)}...`);
      console.log(`      fileId: ${img.fileId || 'N/A'}`);
      console.log(`      alt: ${img.alt || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('\n⚠️  GALLERY FIELD HAS UNEXPECTED FORMAT:');
    console.log(JSON.stringify(gallery, null, 2));
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY:\n');

  if (majorDumpstersReviews.length > 0) {
    console.log('✅ Reviews: DATA EXISTS in Webflow → TEMPLATE ISSUE (designer needs to connect)');
  } else {
    console.log('❌ Reviews: NO DATA in Webflow → SYNC ISSUE (code needs fixing)');
  }

  if (gallery && Array.isArray(gallery) && gallery.length > 0) {
    console.log('✅ Gallery: DATA EXISTS in Webflow → TEMPLATE ISSUE (designer needs to connect)');
  } else {
    console.log('❌ Gallery: NO DATA in Webflow → SYNC ISSUE (code needs fixing)');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

checkWebflowData().catch(console.error);
