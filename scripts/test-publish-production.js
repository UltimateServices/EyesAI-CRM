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

async function testPublish() {
  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  console.log('\n🚀 Testing Webflow publish endpoint...\n');
  console.log(`Company ID: ${companyId}\n`);

  try {
    // Call the local API endpoint
    const response = await fetch(`http://localhost:3001/api/webflow/publish-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId })
    });

    const result = await response.json();

    console.log(`HTTP Status: ${response.status}\n`);

    if (response.ok) {
      console.log('✅ Publish successful!\n');
      console.log('📊 Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Publish failed\n');
      console.log('Error:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testPublish();
