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

async function createUser(email, password) {
  console.log(`Creating user: ${email}...\n`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Auto-confirm email for development
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return;
  }

  console.log('✅ User created successfully!');
  console.log(`Email: ${data.user.email}`);
  console.log(`ID: ${data.user.id}`);
  console.log('\nYou can now sign in with:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node create-user.js <email> <password>');
  console.log('Example: node create-user.js admin@example.com mypassword123');
  process.exit(1);
}

createUser(email, password).catch(console.error);
