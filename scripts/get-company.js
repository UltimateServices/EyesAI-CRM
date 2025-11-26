const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uxlwnphgowjrthqgwwug.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bHducGhnb3dqcnRocWd3d3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjE5NjcsImV4cCI6MjA3NjAzNzk2N30.S5zrmkxEtLeGG6f36Zg2cr9pIMGeiejXov6w4YzpBQc'
);

async function getCompanies() {
  // Get companies
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', '%major%')
    .limit(5);

  if (error) {
    console.error('Error:', error.message);

    // Try getting all companies
    const { data: all, error: err2 } = await supabase
      .from('companies')
      .select('id, name')
      .limit(10);

    if (err2) {
      console.error('Error getting companies:', err2.message);
    } else {
      console.log('All companies:', all);
    }
  } else {
    console.log('Major Dumpsters companies:', companies);
  }

  // Test media_items table
  const { data: media, error: mediaError } = await supabase
    .from('media_items')
    .select('*')
    .limit(1);

  if (mediaError) {
    console.error('\nmedia_items table error:', mediaError.message);
  } else {
    console.log('\nmedia_items table is working! Records:', media?.length || 0);
  }
}

getCompanies();
