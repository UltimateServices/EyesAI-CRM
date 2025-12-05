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

async function checkFieldNames() {
  console.log('\n🔍 CHECKING WEBFLOW FIELD NAMES\n');
  console.log('='.repeat(80));

  // ===== 1. PROFILES COLLECTION - GALLERY FIELD =====
  console.log('\n📸 1. PROFILES COLLECTION - Gallery Field\n');

  const profileRes = await fetch('https://api.webflow.com/v2/collections/6919a7f067ba553645e406a6', {
    headers: {
      'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
      'accept': 'application/json'
    }
  });
  const profileData = await profileRes.json();

  const galleryField = profileData.fields.find(f => f.slug.includes('gallery') || f.slug.includes('photo') || f.slug.includes('image'));

  if (galleryField) {
    console.log('GALLERY FIELD FOUND:');
    console.log(JSON.stringify(galleryField, null, 2));
  } else {
    console.log('❌ NO GALLERY FIELD FOUND');
    console.log('\nAll PROFILES fields:');
    profileData.fields.forEach(f => {
      console.log(`  ${f.slug} (${f.type}) ${f.isRequired ? '[REQUIRED]' : ''}`);
    });
  }

  // ===== 2. REVIEWS COLLECTION - ALL FIELDS =====
  console.log('\n\n⭐ 2. REVIEWS COLLECTION - All Fields\n');

  const reviewsRes = await fetch('https://api.webflow.com/v2/collections/6917304967a914982fd205bc', {
    headers: {
      'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
      'accept': 'application/json'
    }
  });
  const reviewsData = await reviewsRes.json();

  console.log('REVIEWS FIELDS:');
  reviewsData.fields.forEach(f => {
    const required = f.isRequired ? '[REQUIRED]' : '';
    const validations = f.validations ? JSON.stringify(f.validations) : '';
    console.log(`  ${f.slug.padEnd(30)} (${f.type.padEnd(15)}) ${required} ${validations}`);
  });

  // ===== 3. SERVICES COLLECTION - INCLUDED FIELDS =====
  console.log('\n\n🔧 3. SERVICES COLLECTION - Included Fields\n');

  const servicesRes = await fetch('https://api.webflow.com/v2/collections/691b7c75c939d316cb7f73b0', {
    headers: {
      'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
      'accept': 'application/json'
    }
  });
  const servicesData = await servicesRes.json();

  console.log('SERVICES FIELDS (focusing on included fields):');
  servicesData.fields.forEach(f => {
    if (f.slug.includes('include') || f.slug === 'name' || f.slug === 'slug' || f.slug === 'profile') {
      const required = f.isRequired ? '[REQUIRED]' : '';
      console.log(`  ${f.slug.padEnd(30)} (${f.type.padEnd(15)}) ${required}`);
    }
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

checkFieldNames().catch(console.error);
