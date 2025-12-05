# Video Upload Setup Instructions

This document explains how to set up video storage for the welcome video feature (Step 8).

## 1. Run Database Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add welcome_video_url column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS welcome_video_url TEXT;

-- Add comment to column
COMMENT ON COLUMN companies.welcome_video_url IS 'URL of the welcome video stored in Supabase Storage';
```

Or run the migration file:
```bash
psql $DATABASE_URL < supabase-migrations/add-welcome-video-url.sql
```

## 2. Create Supabase Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Enter the following details:
   - **Name**: `videos`
   - **Public bucket**: ✅ Yes (check this box)
   - **File size limit**: Leave default or set your preference
   - **Allowed MIME types**: Leave empty (all video types allowed)

5. Click **Create bucket**

## 3. Set Storage Policies (Optional but Recommended)

For better security, you can set up Row Level Security (RLS) policies:

### Allow authenticated users to upload videos:
```sql
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');
```

### Allow public read access:
```sql
CREATE POLICY "Public can view videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');
```

### Allow authenticated users to delete their videos:
```sql
CREATE POLICY "Authenticated users can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos');
```

## 4. Verify Setup

After completing the steps above:

1. Go to your app's **New Clients** page
2. Find a company in Step 8
3. Click **Upload Video**
4. Select a video file and upload
5. Verify the upload completes successfully
6. Check that the `welcome_video_url` column is populated in the companies table

## Troubleshooting

**Upload fails with 403 error:**
- Verify the storage bucket exists and is named exactly `videos`
- Check that the bucket is set to **public**
- Verify storage policies are correctly configured

**Database update fails:**
- Verify the migration ran successfully
- Check that the `welcome_video_url` column exists in the companies table

**File size too large:**
- Check your Supabase storage limits
- Consider upgrading your Supabase plan if needed
- Compress videos before uploading
