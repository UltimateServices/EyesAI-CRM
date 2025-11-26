const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://uxlwnphgowjrthqgwwug.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bHducGhnb3dqcnRocWd3d3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjE5NjcsImV4cCI6MjA3NjAzNzk2N30.S5zrmkxEtLeGG6f36Zg2cr9pIMGeiejXov6w4YzpBQc'
);

async function duplicateForC2() {
  // Get existing record
  const { data: existing } = await supabase.from('media_items').select('*').limit(1).single();

  if (existing) {
    console.log('Existing record company_id:', existing.company_id);

    // Check if c2 record exists
    const { data: c2Record } = await supabase
      .from('media_items')
      .select('*')
      .eq('company_id', 'c2')
      .maybeSingle();

    if (!c2Record) {
      // Create duplicate for c2
      const { data, error } = await supabase.from('media_items').insert({
        company_id: 'c2',
        file_name: existing.file_name,
        file_url: existing.file_url,
        file_type: existing.file_type,
        file_size: existing.file_size,
        mime_type: existing.mime_type,
        category: existing.category,
        status: 'pending',
        uploaded_by_type: 'client',
        internal_tags: []
      }).select().single();

      if (error) {
        console.log('Error creating c2 record:', error.message);
      } else {
        console.log('Created c2 record:', data.id);
      }
    } else {
      console.log('c2 record already exists');
    }
  } else {
    console.log('No existing media records found');
  }
}

duplicateForC2();
