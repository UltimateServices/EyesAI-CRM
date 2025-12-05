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

async function republishMajorDumpsters() {
  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  console.log('\n🚀 Re-publishing Major Dumpsters to Webflow...\n');
  console.log(`Company ID: ${companyId}\n`);

  try {
    const response = await fetch('http://64.225.63.17:3001/api/webflow/publish-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ companyId })
    });

    console.log(`HTTP Status: ${response.status}\n`);

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Publish successful!\n');
      console.log('📊 Response:', JSON.stringify(result, null, 2));

      if (result.liveUrl) {
        console.log(`\n🌐 Live URL: ${result.liveUrl}`);
      }
    } else {
      console.log('❌ Publish failed\n');
      console.log('Error:', JSON.stringify(result, null, 2));
    }

    console.log('\n📋 Check PM2 logs for sync details:');
    console.log('ssh root@64.225.63.17 "pm2 logs eyesai-crm --lines 50 --nostream | grep -A 20 \'Major Dumpsters\'"');

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

republishMajorDumpsters();
