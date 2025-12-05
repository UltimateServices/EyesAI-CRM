import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use SERVICE ROLE KEY for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log('Adding client_temp_password column to companies table...');

    // Try to select the column to see if it exists
    const { error: checkError } = await supabaseAdmin
      .from('companies')
      .select('client_temp_password')
      .limit(1);

    if (checkError) {
      if (checkError.code === '42703') {
        console.log('Column does not exist yet.');

        // Column doesn't exist - we need to add it
        // Since Supabase doesn't support ALTER TABLE via the client library,
        // we'll return instructions to add it manually
        return NextResponse.json({
          success: false,
          message: 'Please add the column manually in Supabase Dashboard',
          instructions: {
            table: 'companies',
            column: 'client_temp_password',
            type: 'text',
            nullable: true,
            description: 'Temporary password for client portal login (generated once and stored)'
          }
        });
      } else {
        throw checkError;
      }
    }

    console.log('✅ Column already exists!');
    return NextResponse.json({
      success: true,
      message: 'Column client_temp_password already exists'
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
