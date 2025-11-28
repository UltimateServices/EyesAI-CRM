-- Add status column to media_items table
-- This allows VAs to mark media as active, pending, or inactive

ALTER TABLE media_items
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive'));

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_media_items_status ON media_items(status);

-- Add comment
COMMENT ON COLUMN media_items.status IS 'Media status: active (visible), pending (needs review), inactive (hidden)';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'media_items'
AND column_name = 'status';
