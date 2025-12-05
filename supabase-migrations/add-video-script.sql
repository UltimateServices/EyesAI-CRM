-- Add video_script column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS video_script JSONB;

-- Add comment explaining the structure
COMMENT ON COLUMN companies.video_script IS 'HeyGen video script with 4 scenes: {scene1, scene2, scene3, scene4}';
