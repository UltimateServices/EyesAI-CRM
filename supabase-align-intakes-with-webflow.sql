-- Align intakes table structure with Webflow CMS fields
-- This adds new columns that match Webflow exactly
-- Run this in your Supabase SQL Editor

-- Add Webflow-aligned columns to intakes table
ALTER TABLE intakes
  -- Profile content (align with Webflow naming)
  ADD COLUMN IF NOT EXISTS about TEXT,                    -- Maps to 'about-description' in Webflow
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,               -- Maps to 'ai-summary' in Webflow
  ADD COLUMN IF NOT EXISTS social_handle TEXT,            -- Maps to 'social-handle' in Webflow

  -- Contact info (align with Webflow naming)
  ADD COLUMN IF NOT EXISTS phone TEXT,                    -- Maps to 'call-now-2' in Webflow
  ADD COLUMN IF NOT EXISTS email TEXT,                    -- Maps to 'email' in Webflow
  ADD COLUMN IF NOT EXISTS address TEXT,                  -- Maps to 'address' in Webflow
  ADD COLUMN IF NOT EXISTS city TEXT,                     -- Maps to 'city' in Webflow
  ADD COLUMN IF NOT EXISTS state TEXT,                    -- Maps to 'state' in Webflow
  ADD COLUMN IF NOT EXISTS zip TEXT,                      -- Maps to 'zip' in Webflow
  ADD COLUMN IF NOT EXISTS website TEXT,                  -- Maps to 'visit-website-2' in Webflow

  -- Feature tags (align with Webflow naming)
  ADD COLUMN IF NOT EXISTS tag1 TEXT,                     -- Maps to 'about-tag1' in Webflow
  ADD COLUMN IF NOT EXISTS tag2 TEXT,                     -- Maps to 'about-tag2' in Webflow
  ADD COLUMN IF NOT EXISTS tag3 TEXT,                     -- Maps to 'about-tag3' in Webflow
  ADD COLUMN IF NOT EXISTS tag4 TEXT,                     -- Maps to 'about-tag4' in Webflow

  -- Additional content
  ADD COLUMN IF NOT EXISTS pricing_info TEXT,             -- Maps to 'pricing-information' in Webflow
  ADD COLUMN IF NOT EXISTS short_description_webflow TEXT, -- Maps to 'short-description' in Webflow (separate from existing)

  -- Webflow metadata
  ADD COLUMN IF NOT EXISTS webflow_slug TEXT,             -- Maps to 'slug' in Webflow
  ADD COLUMN IF NOT EXISTS package_type TEXT,             -- Maps to 'package-type' in Webflow
  ADD COLUMN IF NOT EXISTS spotlight BOOLEAN DEFAULT false, -- Maps to 'spotlight' in Webflow

  -- Structured data fields
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,          -- Part of schema-json
  ADD COLUMN IF NOT EXISTS yelp_url TEXT;                 -- Part of schema-json

-- Add comments to document the Webflow mapping
COMMENT ON COLUMN intakes.about IS 'Maps to Webflow "about-description" field';
COMMENT ON COLUMN intakes.ai_summary IS 'Maps to Webflow "ai-summary" field (40-140 chars)';
COMMENT ON COLUMN intakes.social_handle IS 'Maps to Webflow "social-handle" field (e.g., @businessname)';
COMMENT ON COLUMN intakes.phone IS 'Maps to Webflow "call-now-2" field';
COMMENT ON COLUMN intakes.email IS 'Maps to Webflow "email" field';
COMMENT ON COLUMN intakes.address IS 'Maps to Webflow "address" field';
COMMENT ON COLUMN intakes.city IS 'Maps to Webflow "city" field';
COMMENT ON COLUMN intakes.state IS 'Maps to Webflow "state" field';
COMMENT ON COLUMN intakes.zip IS 'Maps to Webflow "zip" field';
COMMENT ON COLUMN intakes.website IS 'Maps to Webflow "visit-website-2" field';
COMMENT ON COLUMN intakes.tag1 IS 'Maps to Webflow "about-tag1" field';
COMMENT ON COLUMN intakes.tag2 IS 'Maps to Webflow "about-tag2" field';
COMMENT ON COLUMN intakes.tag3 IS 'Maps to Webflow "about-tag3" field';
COMMENT ON COLUMN intakes.tag4 IS 'Maps to Webflow "about-tag4" field';
COMMENT ON COLUMN intakes.pricing_info IS 'Maps to Webflow "pricing-information" field';
COMMENT ON COLUMN intakes.short_description_webflow IS 'Maps to Webflow "short-description" field (150-200 chars)';
COMMENT ON COLUMN intakes.webflow_slug IS 'Maps to Webflow "slug" field';
COMMENT ON COLUMN intakes.package_type IS 'Maps to Webflow "package-type" field (discover/verified)';
COMMENT ON COLUMN intakes.spotlight IS 'Maps to Webflow "spotlight" field';
COMMENT ON COLUMN intakes.google_maps_url IS 'Part of Webflow "schema-json" field';
COMMENT ON COLUMN intakes.yelp_url IS 'Part of Webflow "schema-json" field';

-- Optional: Migrate data from old columns to new columns
-- Uncomment these if you want to copy existing data

-- Migrate business_description → about
-- UPDATE intakes SET about = business_description WHERE about IS NULL AND business_description IS NOT NULL;

-- Migrate office_phone → phone
-- UPDATE intakes SET phone = office_phone WHERE phone IS NULL AND office_phone IS NOT NULL;

-- Migrate contact_email → email
-- UPDATE intakes SET email = contact_email WHERE email IS NULL AND contact_email IS NOT NULL;

-- Migrate office_address → address
-- UPDATE intakes SET address = office_address WHERE address IS NULL AND office_address IS NOT NULL;

-- Extract badges JSON array → tag1-4
-- UPDATE intakes
-- SET
--   tag1 = badges->0,
--   tag2 = badges->1,
--   tag3 = badges->2,
--   tag4 = badges->3
-- WHERE badges IS NOT NULL AND jsonb_array_length(badges::jsonb) > 0;

-- Verify the new columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'intakes'
AND column_name IN (
  'about', 'ai_summary', 'social_handle', 'phone', 'email', 'address',
  'city', 'state', 'zip', 'website', 'tag1', 'tag2', 'tag3', 'tag4',
  'pricing_info', 'short_description_webflow', 'webflow_slug',
  'package_type', 'spotlight', 'google_maps_url', 'yelp_url'
)
ORDER BY column_name;
