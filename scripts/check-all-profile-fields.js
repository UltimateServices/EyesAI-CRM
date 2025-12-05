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

async function checkAllProfileFields() {
  console.log('\n🔍 ALL PROFILES COLLECTION FIELDS\n');
  console.log('='.repeat(80));

  const profileRes = await fetch('https://api.webflow.com/v2/collections/6919a7f067ba553645e406a6', {
    headers: {
      'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
      'accept': 'application/json'
    }
  });
  const profileData = await profileRes.json();

  console.log(`\nTotal fields: ${profileData.fields.length}\n`);

  profileData.fields.forEach((f, i) => {
    const required = f.isRequired ? '[REQUIRED]' : '';
    const validations = f.validations ? JSON.stringify(f.validations) : '';
    console.log(`${(i + 1).toString().padStart(2)}. ${f.slug.padEnd(40)} (${f.type.padEnd(15)}) ${required}`);
    if (validations) {
      console.log(`    ${validations}`);
    }
  });

  console.log('\n' + '='.repeat(80));

  // Look for multi-image fields specifically
  const multiImageFields = profileData.fields.filter(f =>
    f.type === 'Image' ||
    f.slug.includes('gallery') ||
    f.slug.includes('photo') ||
    f.slug.includes('image')
  );

  console.log('\n📸 IMAGE-RELATED FIELDS:\n');
  multiImageFields.forEach(f => {
    console.log(`${f.slug} (${f.type})`);
    console.log(JSON.stringify(f, null, 2));
    console.log('');
  });

  console.log('='.repeat(80) + '\n');
}

checkAllProfileFields().catch(console.error);
