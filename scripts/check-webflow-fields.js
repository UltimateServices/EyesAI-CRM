// Read .env.local manually
const fs = require('fs');
const path = require('path');

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

const collections = {
  PROFILES: '6919a7f067ba553645e406a6',
  SERVICES: '691b7c75c939d316cb7f73b0',
  FAQS: '692411f2a535a2edbb68ecea',
  SCENARIOS: '692591ebc2715ac9182e11d6',
  LOCATIONS: '6925a0fc2f4eac43ffd125f6',
  REVIEWS: '6917304967a914982fd205bc'
};

async function getFields(name, id) {
  const res = await fetch(`https://api.webflow.com/v2/collections/${id}`, {
    headers: { 'Authorization': `Bearer ${WEBFLOW_TOKEN}` }
  });
  const data = await res.json();
  console.log(`\n=== ${name} (${id}) ===`);
  if (data.fields) {
    data.fields.forEach(f => {
      console.log(`  ${f.slug.padEnd(30)} (${f.type}${f.isRequired ? ', REQUIRED' : ''})`);
    });
  } else {
    console.log('  ERROR:', data);
  }
}

(async () => {
  console.log('Checking Webflow Collection Fields...\n');
  console.log('Token:', WEBFLOW_TOKEN ? 'Found' : 'MISSING');

  for (const [name, id] of Object.entries(collections)) {
    await getFields(name, id);
  }
})();
