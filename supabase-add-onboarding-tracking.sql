-- Add onboarding tracking to intakes table
-- This allows us to track which step (1-9) each company is on

ALTER TABLE intakes
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS step_1_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS step_2_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS step_3_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS step_4_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS step_5_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS step_6_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS step_7_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS step_8_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS step_9_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN intakes.onboarding_step IS 'Current onboarding step (1-9)';
COMMENT ON COLUMN intakes.step_1_completed_at IS 'Stripe signup completed';
COMMENT ON COLUMN intakes.step_2_completed_at IS 'AI Intake pasted and saved';
COMMENT ON COLUMN intakes.step_3_completed_at IS 'Reviews pulled';
COMMENT ON COLUMN intakes.step_4_completed_at IS 'Images uploaded';
COMMENT ON COLUMN intakes.step_5_completed_at IS 'Published to Webflow';
COMMENT ON COLUMN intakes.step_6_completed_at IS 'Screenshots taken';
COMMENT ON COLUMN intakes.step_7_completed_at IS 'Video script generated';
COMMENT ON COLUMN intakes.step_8_completed_at IS 'Video created';
COMMENT ON COLUMN intakes.step_9_completed_at IS 'Welcome email sent';
COMMENT ON COLUMN intakes.onboarding_completed_at IS 'All 9 steps completed';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'intakes'
AND column_name LIKE '%onboarding%' OR column_name LIKE '%step_%'
ORDER BY column_name;
