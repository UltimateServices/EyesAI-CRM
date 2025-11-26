const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uxlwnphgowjrthqgwwug.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bHducGhnb3dqcnRocWd3d3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjE5NjcsImV4cCI6MjA3NjAzNzk2N30.S5zrmkxEtLeGG6f36Zg2cr9pIMGeiejXov6w4YzpBQc'
);

async function check() {
  // List buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets?.map(b => b.name) || 'Error:', bucketsError?.message);

  // Check media_items table
  const { data, error } = await supabase.from('media_items').select('*').limit(5);
  console.log('\nmedia_items records:', data?.length || 0);
  if (error) console.log('Error:', error.message);
  if (data?.length > 0) console.log('Sample:', data[0]);
}

check();
