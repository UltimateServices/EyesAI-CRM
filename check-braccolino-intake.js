const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uxlwnphgowjrthqgwwug.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bHducGhnb3dqcnRocWd3d3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjE5NjcsImV4cCI6MjA3NjAzNzk2N30.S5zrmkxEtLeGG6f36Zg2cr9pIMGeiejXov6w4YzpBQc'
);

async function checkBraccolino() {
  // Get company
  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', '%Braccolino%')
    .single();

  console.log('Company:', company.name, 'ID:', company.id);

  // Check for intake
  const { data: intake, error } = await supabase
    .from('intakes')
    .select(`
      id,
      tagline,
      short_description,
      badges,
      office_phone,
      contact_email,
      office_address,
      facebook_url,
      instagram_url,
      youtube_url,
      roma_data
    `)
    .eq('company_id', company.id)
    .single();

  if (error) {
    console.log('\n❌ NO INTAKE FOUND');
    console.log('Error:', error.message);
    return;
  }

  console.log('\n✅ INTAKE EXISTS:\n');
  console.log('Tagline:', intake.tagline || '(empty)');
  console.log('Short Description:', intake.short_description || '(empty)');
  console.log('Badges:', intake.badges || '(empty)');
  console.log('Phone:', intake.office_phone || '(empty)');
  console.log('Email:', intake.contact_email || '(empty)');
  console.log('Address:', intake.office_address || '(empty)');
  console.log('Facebook:', intake.facebook_url || '(empty)');
  console.log('Instagram:', intake.instagram_url || '(empty)');
  console.log('YouTube:', intake.youtube_url || '(empty)');
  console.log('Roma Data:', intake.roma_data ? 'HAS DATA' : '(empty)');
}

checkBraccolino();
