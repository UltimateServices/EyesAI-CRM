-- Comprehensive verification of Supabase setup for onboarding flow
-- Run this to make sure everything is ready for Step 2

-- ============================================
-- CHECK 1: Intakes table - Webflow-aligned columns
-- ============================================
SELECT 'Webflow-aligned columns in intakes:' as check_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'intakes'
AND column_name IN (
  'about', 'ai_summary', 'social_handle', 'phone', 'email', 'address',
  'city', 'state', 'zip', 'website', 'tag1', 'tag2', 'tag3', 'tag4',
  'pricing_info', 'short_description_webflow', 'webflow_slug',
  'package_type', 'spotlight', 'google_maps_url', 'yelp_url', 'tagline'
)
ORDER BY column_name;

-- ============================================
-- CHECK 2: Intakes table - Onboarding tracking columns
-- ============================================
SELECT 'Onboarding tracking columns in intakes:' as check_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'intakes'
AND (column_name LIKE '%onboarding%' OR column_name LIKE 'step_%')
ORDER BY column_name;

-- ============================================
-- CHECK 3: Companies table - Essential columns
-- ============================================
SELECT 'Essential columns in companies:' as check_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
AND column_name IN (
  'id', 'name', 'website', 'status', 'plan', 'organization_id',
  'tagline', 'about', 'ai_summary', 'tag1', 'tag2', 'tag3', 'tag4',
  'phone', 'email', 'address', 'city', 'state', 'zip',
  'facebook_url', 'instagram_url', 'youtube_url',
  'logo_url', 'pricing_info', 'google_maps_url', 'yelp_url',
  'webflow_published', 'webflow_slug', 'last_synced_at'
)
ORDER BY column_name;

-- ============================================
-- CHECK 4: Sample data check
-- ============================================
SELECT 'Sample intake data:' as check_name;
SELECT
  id,
  company_id,
  business_name,
  onboarding_step,
  step_1_completed_at IS NOT NULL as step1_done,
  step_2_completed_at IS NOT NULL as step2_done,
  about IS NOT NULL as has_about,
  tagline IS NOT NULL as has_tagline,
  phone IS NOT NULL as has_phone,
  email IS NOT NULL as has_email,
  status
FROM intakes
LIMIT 3;

-- ============================================
-- CHECK 5: Companies with status NEW
-- ============================================
SELECT 'Companies with NEW status:' as check_name;
SELECT
  c.id,
  c.name,
  c.website,
  c.status,
  c.plan,
  i.onboarding_step,
  i.step_1_completed_at IS NOT NULL as step1_done
FROM companies c
LEFT JOIN intakes i ON i.company_id = c.id
WHERE c.status = 'NEW'
LIMIT 5;

-- ============================================
-- SUMMARY: What's missing (if anything)
-- ============================================
SELECT 'SUMMARY - Missing Webflow columns in intakes:' as check_name;
SELECT
  col.column_name as missing_column
FROM (
  SELECT unnest(ARRAY[
    'about', 'ai_summary', 'social_handle', 'phone', 'email', 'address',
    'city', 'state', 'zip', 'website', 'tag1', 'tag2', 'tag3', 'tag4',
    'pricing_info', 'short_description_webflow', 'webflow_slug',
    'package_type', 'spotlight', 'google_maps_url', 'yelp_url', 'tagline',
    'onboarding_step', 'step_1_completed_at', 'step_2_completed_at',
    'step_3_completed_at', 'step_4_completed_at', 'step_5_completed_at',
    'step_6_completed_at', 'step_7_completed_at', 'step_8_completed_at',
    'step_9_completed_at', 'onboarding_completed_at'
  ]) as column_name
) col
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'intakes'
  AND column_name = col.column_name
);

-- ============================================
-- ALL DONE - If no missing columns shown above, you're ready!
-- ============================================
