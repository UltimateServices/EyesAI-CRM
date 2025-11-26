const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uxlwnphgowjrthqgwwug.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('Running media_items migration...\n');

  // Create media_items table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS media_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL,
      organization_id UUID,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
      file_size INTEGER NOT NULL,
      mime_type TEXT,
      category TEXT NOT NULL CHECK (category IN ('logo', 'photo', 'video')),
      internal_tags TEXT[] DEFAULT '{}',
      priority INTEGER DEFAULT 0,
      uploaded_by_type TEXT NOT NULL CHECK (uploaded_by_type IN ('worker', 'client')),
      uploaded_by_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

  if (tableError) {
    // Try direct query if RPC doesn't exist
    console.log('RPC not available, table may already exist or needs manual creation');
    console.log('Error:', tableError.message);
  } else {
    console.log('✅ media_items table created');
  }

  // Check if table exists by querying it
  const { data, error } = await supabase
    .from('media_items')
    .select('id')
    .limit(1);

  if (error) {
    console.log('\n❌ Table does not exist yet. Please run this SQL in Supabase Dashboard:\n');
    console.log('Go to: https://supabase.com/dashboard/project/uxlwnphgowjrthqgwwug/sql/new\n');
    console.log('------- SQL START -------');
    console.log(createTableSQL);
    console.log('------- SQL END -------\n');
  } else {
    console.log('✅ media_items table exists and is accessible');
    console.log('Current records:', data?.length || 0);
  }
}

runMigration().catch(console.error);
