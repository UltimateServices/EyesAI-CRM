-- Add 'screenshot' category to media_items

-- Step 1: Drop existing constraint
ALTER TABLE media_items DROP CONSTRAINT IF EXISTS media_items_category_check;

-- Step 2: Add new constraint with 'screenshot' category
ALTER TABLE media_items ADD CONSTRAINT media_items_category_check
  CHECK (category IN ('logo', 'photo', 'video', 'screenshot'));

-- Step 3: Update client RLS policy to exclude screenshots
DROP POLICY IF EXISTS "Clients can view their media" ON media_items;

CREATE POLICY "Clients can view their media (no screenshots)" ON media_items
  FOR SELECT USING (
    category != 'screenshot' AND
    company_id IN (
      SELECT id FROM companies WHERE id = company_id
    )
  );

-- Add comment
COMMENT ON CONSTRAINT media_items_category_check ON media_items IS
  'Allowed categories: logo, photo, video, screenshot (screenshot is internal-only for workers)';
