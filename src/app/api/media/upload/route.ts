import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// POST /api/media/upload - Upload file to Supabase storage and create record
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;
    const organizationId = formData.get('organizationId') as string | null;
    const category = formData.get('category') as 'logo' | 'photo' | 'video' | 'eyes-content';
    const uploadedByType = formData.get('uploadedByType') as 'worker' | 'client';
    const uploadedById = formData.get('uploadedById') as string | null;

    if (!file || !companyId || !category) {
      return NextResponse.json(
        { error: 'File, companyId, and category are required' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Determine file type
    let fileType: 'image' | 'video' | 'document' = 'document';
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type.startsWith('video/')) {
      fileType = 'video';
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const uniqueId = uuidv4();
    const filePath = `${companyId}/${category}/${uniqueId}.${fileExt}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    // Create database record
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_items')
      .insert({
        company_id: companyId,
        organization_id: organizationId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        category,
        status: 'pending', // New uploads start as pending
        uploaded_by_type: uploadedByType || 'client',
        uploaded_by_id: uploadedById,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Clean up uploaded file if db insert fails
      await supabase.storage.from('media').remove([filePath]);
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mediaRecord,
      url: publicUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
