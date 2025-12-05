const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTempPasswordColumn() {
  try {
    console.log('Adding client_temp_password column to companies table...');

    // Check if column already exists
    const { data: columns, error: checkError } = await supabase
      .from('companies')
      .select('client_temp_password')
      .limit(1);

    if (checkError && checkError.code === '42703') {
      console.log('Column does not exist yet, will add it.');
    } else if (!checkError) {
      console.log('✅ Column already exists!');
      return;
    }

    // Since we can't run raw SQL easily, we'll use the REST API
    // The column will be added manually via Supabase dashboard or we'll update via the API
    console.log('Please add the column via Supabase dashboard:');
    console.log('Column name: client_temp_password');
    console.log('Type: text');
    console.log('Nullable: true');

  } catch (error) {
    console.error('Migration error:', error);
  }
}

addTempPasswordColumn();
