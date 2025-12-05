import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/media - List media items for a company
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get('companyId');
    const category = searchParams.get('category'); // logo, photo, video
    const excludeEyesContent = searchParams.get('excludeEyesContent') === 'true'; // For client-side filtering

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('media_items')
      .select('*')
      .eq('company_id', companyId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching media:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Filter out eyes-content category only for client requests
    const filteredData = excludeEyesContent
      ? data?.filter(item =>
          item.category !== 'eyes-content' && !item.internal_tags?.includes('eyes-content')
        ) || []
      : data || [];

    return NextResponse.json({ data: filteredData });
  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/media - Create media item record (after upload)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const body = await request.json();

    const {
      companyId,
      organizationId,
      fileName,
      fileUrl,
      fileType,
      fileSize,
      mimeType,
      category,
      uploadedByType,
      uploadedById,
    } = body;

    // Validate required fields
    if (!companyId || !fileName || !fileUrl || !fileType || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('media_items')
      .insert({
        company_id: companyId,
        organization_id: organizationId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize || 0,
        mime_type: mimeType,
        category,
        uploaded_by_type: uploadedByType || 'client',
        uploaded_by_id: uploadedById,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating media record:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Media POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH /api/media - Update media item (status, internal_tags, etc)
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const body = await request.json();

    const { id, status, internal_tags, priority } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (internal_tags !== undefined) updates.internal_tags = internal_tags;
    if (priority !== undefined) updates.priority = priority;

    const { data, error } = await supabase
      .from('media_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating media:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If this media item is tagged as "Logo" and is active, update company logo_url
    if (data && internal_tags?.includes('logo') && (status === 'active' || data.status === 'active')) {
      const { error: companyError } = await supabase
        .from('companies')
        .update({ logo_url: data.file_url })
        .eq('id', data.company_id);

      if (companyError) {
        console.error('Error updating company logo:', companyError);
        // Don't fail the request if company update fails, just log it
      }

      // Also update intake table logo_url if exists
      const { error: intakeError } = await supabase
        .from('intakes')
        .update({ logo_url: data.file_url })
        .eq('company_id', data.company_id);

      if (intakeError) {
        console.error('Error updating intake logo:', intakeError);
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Media PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/media - Delete media item
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);

    const mediaId = searchParams.get('id');

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // First get the media item to get the file URL
    const { data: mediaItem, error: fetchError } = await supabase
      .from('media_items')
      .select('file_url')
      .eq('id', mediaId)
      .single();

    if (fetchError) {
      console.error('Error fetching media for deletion:', fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    // Delete from storage if it's a Supabase storage URL
    if (mediaItem?.file_url?.includes('supabase')) {
      const urlParts = mediaItem.file_url.split('/storage/v1/object/public/media/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        const { error: storageError } = await supabase.storage
          .from('media')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting from storage:', storageError);
          // Continue to delete the record even if storage deletion fails
        }
      }
    }

    // Delete the database record
    const { error: deleteError } = await supabase
      .from('media_items')
      .delete()
      .eq('id', mediaId);

    if (deleteError) {
      console.error('Error deleting media record:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
