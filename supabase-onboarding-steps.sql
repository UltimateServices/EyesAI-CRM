-- Create onboarding_steps table to track completion status
CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, step_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_company_id ON public.onboarding_steps(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_completed ON public.onboarding_steps(completed);

-- Enable RLS
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organization members can view onboarding steps"
  ON public.onboarding_steps FOR SELECT
  USING (company_id IN (
    SELECT c.id FROM public.companies c
    INNER JOIN public.organization_members om ON c.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Organization members can insert onboarding steps"
  ON public.onboarding_steps FOR INSERT
  WITH CHECK (company_id IN (
    SELECT c.id FROM public.companies c
    INNER JOIN public.organization_members om ON c.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
  ));

CREATE POLICY "Organization members can update onboarding steps"
  ON public.onboarding_steps FOR UPDATE
  USING (company_id IN (
    SELECT c.id FROM public.companies c
    INNER JOIN public.organization_members om ON c.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
  ));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER onboarding_steps_updated_at
  BEFORE UPDATE ON public.onboarding_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_steps_updated_at();

-- Function to initialize onboarding steps for a new company
CREATE OR REPLACE FUNCTION initialize_onboarding_steps(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.onboarding_steps (company_id, step_number, step_name, completed, completed_at)
  VALUES
    (p_company_id, 1, 'Stripe Signup', TRUE, NOW()),
    (p_company_id, 2, 'AI Intake', FALSE, NULL),
    (p_company_id, 3, 'Pull Reviews', FALSE, NULL),
    (p_company_id, 4, 'Upload Images', FALSE, NULL),
    (p_company_id, 5, 'Publish Profile', FALSE, NULL),
    (p_company_id, 6, 'Screenshot Profile', FALSE, NULL),
    (p_company_id, 7, 'Video Script', FALSE, NULL),
    (p_company_id, 8, 'Create Video', FALSE, NULL),
    (p_company_id, 9, 'Welcome Email', FALSE, NULL)
  ON CONFLICT (company_id, step_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically initialize steps when a company with status='NEW' is created
CREATE OR REPLACE FUNCTION auto_initialize_onboarding_steps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'NEW' THEN
    PERFORM initialize_onboarding_steps(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_onboarding_steps_init
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_onboarding_steps();
