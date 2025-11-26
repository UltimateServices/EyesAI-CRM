-- Add Webflow sync tracking fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS webflow_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS webflow_slug TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_webflow_published ON public.companies(webflow_published);
CREATE INDEX IF NOT EXISTS idx_companies_webflow_slug ON public.companies(webflow_slug);

-- Function to generate slug from company name
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;
