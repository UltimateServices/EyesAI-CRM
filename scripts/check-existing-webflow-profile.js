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
const profileId = '692c985b909809252a48d820'; // From PM2 logs

async function checkExistingProfile() {
  console.log('\n🔍 CHECKING EXISTING WEBFLOW PROFILE\n');
  console.log(`Profile ID: ${profileId}\n`);
  console.log('='.repeat(80));

  // ===== FETCH PROFILE =====
  console.log('\n📊 PROFILE DATA\n');

  const profileRes = await fetch(
    `https://api.webflow.com/v2/collections/6919a7f067ba553645e406a6/items/${profileId}`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );

  if (!profileRes.ok) {
    console.log(`❌ Failed to fetch profile: ${profileRes.status}`);
    const errorText = await profileRes.text();
    console.log(`Error: ${errorText}`);
    return;
  }

  const profileData = await profileRes.json();
  const fd = profileData.fieldData;

  console.log(`business-name: ${fd['business-name']}`);
  console.log(`slug: ${fd.slug}`);
  console.log(`ai-summary: ${fd['ai-summary']?.substring(0, 80) || 'EMPTY'}...`);
  console.log(`call-now-2: ${fd['call-now-2'] || 'EMPTY'}`);
  console.log(`email: ${fd['email'] || 'EMPTY'}`);
  console.log(`about-tag1: ${fd['about-tag1'] || 'EMPTY'}`);
  console.log(`pricing-information: ${fd['pricing-information']?.substring(0, 60) || 'EMPTY'}...`);

  // GALLERY
  const gallery = fd.gallery;
  console.log(`\n🖼️  GALLERY:`);
  if (!gallery || (Array.isArray(gallery) && gallery.length === 0)) {
    console.log(`   ❌ EMPTY`);
  } else {
    console.log(`   ✅ ${Array.isArray(gallery) ? gallery.length : 1} images`);
    if (Array.isArray(gallery)) {
      gallery.slice(0, 3).forEach((img, i) => {
        console.log(`   ${i + 1}. ${img.url?.substring(0, 70)}...`);
      });
    }
  }

  // ===== CHECK CHILD ITEMS =====
  console.log('\n\n📦 CHILD ITEMS\n');

  // Services
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
  const services = servicesData.items?.filter(s => s.fieldData?.profile === profileId) || [];
  console.log(`Services: ${services.length}`);
  if (services.length > 0) {
    const s = services[0].fieldData;
    console.log(`  - "${s.name}"`);
    console.log(`    included1: "${s.included1 || 'EMPTY'}"`);
    console.log(`    included2: "${s.included2 || 'EMPTY'}"`);
  }

  // Reviews
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
  const reviews = reviewsData.items?.filter(r => r.fieldData?.profile === profileId) || [];
  console.log(`Reviews: ${reviews.length}`);

  // FAQs
  const faqsRes = await fetch(
    `https://api.webflow.com/v2/collections/692411f2a535a2edbb68ecea/items`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );
  const faqsData = await faqsRes.json();
  const faqs = faqsData.items?.filter(f => f.fieldData?.profile === profileId) || [];
  console.log(`FAQs: ${faqs.length}`);

  // Scenarios
  const scenariosRes = await fetch(
    `https://api.webflow.com/v2/collections/692591ebc2715ac9182e11d6/items`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );
  const scenariosData = await scenariosRes.json();
  const scenarios = scenariosData.items?.filter(s => s.fieldData?.profile === profileId) || [];
  console.log(`Scenarios: ${scenarios.length}`);

  // Service References
  const refsRes = await fetch(
    `https://api.webflow.com/v2/collections/69258b73b4aa5928c4949176/items`,
    {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
        'accept': 'application/json'
      }
    }
  );
  const refsData = await refsRes.json();
  const refs = refsData.items?.filter(r => r.fieldData?.profile === profileId) || [];
  console.log(`Service References: ${refs.length}`);

  console.log('\n' + '='.repeat(80) + '\n');
}

checkExistingProfile().catch(console.error);
