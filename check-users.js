const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listUsers() {
  console.log('Fetching users from Supabase...\n');

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error fetching users:', error.message);
    return;
  }

  if (data.users.length === 0) {
    console.log('No users found in the database.');
    console.log('\nWould you like to create a user? You can use the Supabase dashboard or run:');
    console.log('node create-user.js <email> <password>');
    return;
  }

  console.log(`Found ${data.users.length} user(s):\n`);

  data.users.forEach((user, index) => {
    console.log(`User ${index + 1}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log(`  Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
    console.log(`  Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No (Check email for confirmation link)'}`);
    console.log('');
  });
}

listUsers().catch(console.error);
