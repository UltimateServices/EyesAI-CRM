-- Create webflow_settings table
CREATE TABLE IF NOT EXISTS public.webflow_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  webflow_app_url TEXT,
  webflow_api_token TEXT,
  crm_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.webflow_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view their settings
CREATE POLICY "Organization members can view webflow settings"
  ON public.webflow_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Organization admins can insert settings
CREATE POLICY "Organization admins can create webflow settings"
  ON public.webflow_settings
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Organization admins can update settings
CREATE POLICY "Organization admins can update webflow settings"
  ON public.webflow_settings
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webflow_settings_org
  ON public.webflow_settings(organization_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_webflow_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webflow_settings_timestamp
  BEFORE UPDATE ON public.webflow_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_webflow_settings_updated_at();
