import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyName = searchParams.get('company') || 'Legacy Home Remodeling';

  const supabase = createRouteHandlerClient({ cookies });

  // Get company ID
  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('name', companyName)
    .single();

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  // Get all media items (including deleted)
  const { data: allMedia, error: allError } = await supabase
    .from('media_items')
    .select('id, file_name, category, status, internal_tags, created_at, updated_at')
    .eq('company_id', company.id)
    .order('created_at', { ascending: true });

  // Get only active media
  const { data: activeMedia, error: activeError } = await supabase
    .from('media_items')
    .select('id, file_name, category, status, internal_tags')
    .eq('company_id', company.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  return NextResponse.json({
    company: { id: company.id, name: company.name },
    allMedia: allMedia || [],
    allMediaCount: allMedia?.length || 0,
    activeMedia: activeMedia || [],
    activeMediaCount: activeMedia?.length || 0,
    errors: {
      all: allError?.message,
      active: activeError?.message
    }
  });
}
