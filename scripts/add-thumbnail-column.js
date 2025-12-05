const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addThumbnailColumn() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./supabase-migrations/add_video_thumbnail_column.sql', 'utf8');

    console.log('Running migration...');
    console.log(sql);

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error:', error);

      // Try direct approach
      console.log('\nTrying direct ALTER TABLE...');
      const { error: alterError } = await supabase
        .from('companies')
        .select('welcome_video_thumbnail_url')
        .limit(1);

      if (alterError && alterError.code === '42703') {
        console.log('Column does not exist, will be added via direct SQL execution');
      }
    } else {
      console.log('✅ Migration successful!', data);
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

addThumbnailColumn();
