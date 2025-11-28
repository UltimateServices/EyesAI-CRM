// Quick script to check what data exists in the database for a company
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uxlwnphgowjrthqgwwug.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bHducGhnb3dqcnRocWd3d3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjE5NjcsImV4cCI6MjA3NjAzNzk2N30.S5zrmkxEtLeGG6f36Zg2cr9pIMGeiejXov6w4YzpBQc'
);

async function checkCompanyData() {
  // First get the company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', '%Braccolino%')
    .single();

  if (companyError) {
    console.error('Error fetching company:', companyError);
    return;
  }

  console.log('Found company:', company.name, 'ID:', company.id);

  // Now check if there's intake data
  const { data: intake, error: intakeError } = await supabase
    .from('intakes')
    .select('id, company_id, status, romaData, createdAt')
    .eq('company_id', company.id)
    .single();

  if (intakeError) {
    console.log('\n❌ NO INTAKE DATA FOUND');
    console.log('Error:', intakeError.message);
    return;
  }

  console.log('\n✅ INTAKE DATA EXISTS');
  console.log('Intake ID:', intake.id);
  console.log('Status:', intake.status);
  console.log('Created:', intake.createdAt);
  console.log('Has romaData:', !!intake.romaData);

  if (intake.romaData) {
    console.log('\nromaData structure:');
    console.log('- ai_overview:', !!intake.romaData.ai_overview);
    console.log('- hero:', !!intake.romaData.hero);
    console.log('- about_and_badges:', !!intake.romaData.about_and_badges);
    console.log('- locations_and_hours:', !!intake.romaData.locations_and_hours);
  }

  const { data, error } = await supabase
    .from('companies')
    .select(`
      name,
      tagline,
      about,
      ai_summary,
      tag1,
      tag2,
      tag3,
      tag4,
      pricing_info,
      instagram_url,
      youtube_url,
      facebook_url,
      logo_url,
      website,
      phone,
      email,
      city,
      state
    `)
    .eq('id', company.id)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return;
  }

  console.log('\n=== BRACCOLINO POOL & SPA DATA ===\n');
  console.log('Basic Info:');
  console.log('  Name:', data.name);
  console.log('  Website:', data.website || '(empty)');
  console.log('  Phone:', data.phone || '(empty)');
  console.log('  Email:', data.email || '(empty)');
  console.log('  City:', data.city || '(empty)');
  console.log('  State:', data.state || '(empty)');

  console.log('\nContent Fields:');
  console.log('  Tagline:', data.tagline || '(empty)');
  console.log('  About:', data.about ? `${data.about.substring(0, 100)}...` : '(empty)');
  console.log('  AI Summary:', data.ai_summary ? `${data.ai_summary.substring(0, 100)}...` : '(empty)');

  console.log('\nTags:');
  console.log('  Tag 1:', data.tag1 || '(empty)');
  console.log('  Tag 2:', data.tag2 || '(empty)');
  console.log('  Tag 3:', data.tag3 || '(empty)');
  console.log('  Tag 4:', data.tag4 || '(empty)');

  console.log('\nAdditional:');
  console.log('  Pricing Info:', data.pricing_info || '(empty)');
  console.log('  Logo URL:', data.logo_url || '(empty)');

  console.log('\nSocial Media:');
  console.log('  Facebook:', data.facebook_url || '(empty)');
  console.log('  Instagram:', data.instagram_url || '(empty)');
  console.log('  YouTube:', data.youtube_url || '(empty)');
}

checkCompanyData();
