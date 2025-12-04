-- Add welcome_video_thumbnail_url column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS welcome_video_thumbnail_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN companies.welcome_video_thumbnail_url IS 'URL to the thumbnail image extracted from the welcome video';
