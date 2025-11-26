-- Create storage bucket for media files
-- Run this via Supabase Dashboard or CLI

-- Insert bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true, -- public bucket for serving images
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND
    auth.role() = 'authenticated'
  );

-- Allow anyone to read (public bucket)
CREATE POLICY "Anyone can read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
