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

async function checkOnboardingSteps() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n🔍 Checking onboarding_steps for Major Dumpsters companies...\n');

  const companyIds = [
    '60db5fa2-424a-4a07-91de-963271a4ea31',
    'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39'
  ];

  for (const companyId of companyIds) {
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .eq('id', companyId)
      .single();

    console.log(`📋 Company: ${company?.name}`);
    console.log(`   ID: ${companyId}`);
    console.log(`   Created: ${company?.created_at}`);

    const { data: steps } = await supabase
      .from('onboarding_steps')
      .select('*')
      .eq('company_id', companyId)
      .order('step_number');

    if (steps && steps.length > 0) {
      console.log(`   Onboarding steps: ${steps.length}`);
      steps.forEach(s => {
        const status = s.completed ? '✓' : '✗';
        console.log(`     ${status} Step ${s.step_number}: ${s.completed ? 'Complete' : 'Incomplete'}`);
      });
    } else {
      console.log(`   No onboarding steps found`);
    }

    // Check for intake
    const { data: intake } = await supabase
      .from('intakes')
      .select('id')
      .eq('company_id', companyId)
      .single();

    console.log(`   Intake: ${intake ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log('');
  }

  // Also check ALL onboarding steps to find which companies are in onboarding
  console.log('\n📊 All companies in onboarding:\n');

  const { data: allSteps } = await supabase
    .from('onboarding_steps')
    .select(`
      company_id,
      step_number,
      completed,
      companies (
        name
      )
    `)
    .order('company_id, step_number');

  if (allSteps) {
    const byCompany = {};
    allSteps.forEach(step => {
      if (!byCompany[step.company_id]) {
        byCompany[step.company_id] = {
          name: step.companies?.name || 'Unknown',
          steps: []
        };
      }
      byCompany[step.company_id].steps.push({
        number: step.step_number,
        completed: step.completed
      });
    });

    Object.entries(byCompany).forEach(([companyId, data]) => {
      const completedCount = data.steps.filter(s => s.completed).length;
      console.log(`${data.name}: ${completedCount}/${data.steps.length} steps (ID: ${companyId.substring(0, 8)}...)`);
    });
  }
}

checkOnboardingSteps().catch(console.error);
