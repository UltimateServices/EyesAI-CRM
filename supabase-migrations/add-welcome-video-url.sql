-- Add welcome_video_url column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS welcome_video_url TEXT;

-- Add comment to column
COMMENT ON COLUMN companies.welcome_video_url IS 'URL of the welcome video stored in Supabase Storage';
