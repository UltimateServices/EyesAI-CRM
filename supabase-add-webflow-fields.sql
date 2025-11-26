-- Add missing fields to companies table for complete Webflow CMS sync
-- Run this in your Supabase SQL Editor

-- Add missing text fields for profile information
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS about TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add missing social media URLs
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add optional fields for enhanced profiles
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS pricing_info TEXT,
  ADD COLUMN IF NOT EXISTS tag1 TEXT,
  ADD COLUMN IF NOT EXISTS tag2 TEXT,
  ADD COLUMN IF NOT EXISTS tag3 TEXT,
  ADD COLUMN IF NOT EXISTS tag4 TEXT;

-- Add comment to document the schema
COMMENT ON COLUMN companies.tagline IS 'Short tagline/slogan for the business';
COMMENT ON COLUMN companies.about IS 'Full business description';
COMMENT ON COLUMN companies.ai_summary IS 'AI-generated summary of the business';
COMMENT ON COLUMN companies.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN companies.youtube_url IS 'YouTube channel URL';
COMMENT ON COLUMN companies.pricing_info IS 'General pricing information';
COMMENT ON COLUMN companies.tag1 IS 'Feature highlight tag 1';
COMMENT ON COLUMN companies.tag2 IS 'Feature highlight tag 2';
COMMENT ON COLUMN companies.tag3 IS 'Feature highlight tag 3';
COMMENT ON COLUMN companies.tag4 IS 'Feature highlight tag 4';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
AND column_name IN ('tagline', 'about', 'ai_summary', 'instagram_url', 'youtube_url', 'pricing_info', 'tag1', 'tag2', 'tag3', 'tag4')
ORDER BY column_name;
