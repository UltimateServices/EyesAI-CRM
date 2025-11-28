const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uxlwnphgowjrthqgwwug.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bHducGhnb3dqcnRocWd3d3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjE5NjcsImV4cCI6MjA3NjAzNzk2N30.S5zrmkxEtLeGG6f36Zg2cr9pIMGeiejXov6w4YzpBQc'
);

async function checkSchema() {
  // Check intakes table schema
  const { data, error } = await supabase
    .from('intakes')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Intakes table columns:');
    console.log(Object.keys(data[0]));
    console.log('\nSample row:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No data in intakes table');
  }
}

checkSchema();
