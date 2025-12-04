import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Generate thumbnail from video
async function generateThumbnail(videoBuffer: Buffer): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const tempDir = tmpdir();
    const videoPath = join(tempDir, `video-${Date.now()}.mp4`);
    const thumbnailPath = join(tempDir, `thumbnail-${Date.now()}.jpg`);

    try {
      // Write video buffer to temp file
      await writeFile(videoPath, videoBuffer);

      // Extract frame at 1 second
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['1'],
          filename: thumbnailPath.split('/').pop()!,
          folder: tempDir,
          size: '1280x720'
        })
        .on('end', async () => {
          try {
            // Read the generated thumbnail
            const fs = require('fs');
            const thumbnailBuffer = fs.readFileSync(thumbnailPath);

            // Clean up temp files
            await unlink(videoPath).catch(() => {});
            await unlink(thumbnailPath).catch(() => {});

            resolve(thumbnailBuffer);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          // Clean up on error
          unlink(videoPath).catch(() => {});
          unlink(thumbnailPath).catch(() => {});
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the form data
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const companyId = formData.get('companyId') as string;

    if (!videoFile || !companyId) {
      return NextResponse.json(
        { error: 'Video file and company ID are required' },
        { status: 400 }
      );
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, organization_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Generate unique filename
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${companyId}-welcome-video-${Date.now()}.${fileExt}`;
    const filePath = `eyes-content/${fileName}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (use 'media' bucket like Media Gallery)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, buffer, {
        contentType: videoFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload video: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    const videoUrl = publicUrlData.publicUrl;

    // Create media_items record so it appears in the gallery
    const { error: mediaError } = await supabase
      .from('media_items')
      .insert({
        company_id: companyId,
        organization_id: company.organization_id,
        file_name: videoFile.name,
        file_url: videoUrl,
        file_type: 'video',
        file_size: videoFile.size,
        mime_type: videoFile.type,
        category: 'eyes-content',
        status: 'active',
        uploaded_by_type: 'worker',
        internal_tags: ['welcome-video'],
      });

    if (mediaError) {
      console.error('Media item creation error:', mediaError);
      // Continue anyway - the file is uploaded and URL is saved
    }

    // Generate thumbnail
    console.log('Generating video thumbnail...');
    let thumbnailUrl = null;
    try {
      const thumbnailBuffer = await generateThumbnail(buffer);

      // Upload thumbnail to Supabase Storage
      const thumbnailFileName = `${companyId}-welcome-thumbnail-${Date.now()}.jpg`;
      const thumbnailPath = `eyes-content/${thumbnailFileName}`;

      const { error: thumbnailUploadError } = await supabase.storage
        .from('media')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (thumbnailUploadError) {
        console.error('Thumbnail upload error:', thumbnailUploadError);
        // Continue anyway - thumbnail is optional
      } else {
        const { data: thumbnailUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(thumbnailPath);

        thumbnailUrl = thumbnailUrlData.publicUrl;
        console.log('✅ Thumbnail uploaded:', thumbnailUrl);
      }
    } catch (thumbnailError) {
      console.error('Thumbnail generation error:', thumbnailError);
      // Continue anyway - thumbnail is optional
    }

    // Update company with video URL and thumbnail URL
    const updateData: any = { welcome_video_url: videoUrl };
    if (thumbnailUrl) {
      updateData.welcome_video_thumbnail_url = thumbnailUrl;
    }

    const { error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update company with video URL' },
        { status: 500 }
      );
    }

    // Mark step 8 as complete
    const { error: stepError } = await supabase
      .from('onboarding_steps')
      .update({ completed: true })
      .eq('company_id', companyId)
      .eq('step_number', 8);

    if (stepError) {
      console.error('Step update error:', stepError);
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome video uploaded successfully',
      videoUrl,
    });
  } catch (error: any) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload video' },
      { status: 500 }
    );
  }
}
