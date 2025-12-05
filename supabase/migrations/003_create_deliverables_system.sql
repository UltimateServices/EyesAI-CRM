-- Migration: Create Monthly Deliverables System
-- Created: 2025-12-05

-- Update companies table with deliverables tracking columns
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_cycle_start DATE,
ADD COLUMN IF NOT EXISTS package_type TEXT CHECK (package_type IN ('discover', 'verified'));

-- Create deliverable_months table
CREATE TABLE IF NOT EXISTS deliverable_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  month_number INTEGER NOT NULL, -- 1, 2, 3... (which month of service)
  cycle_start_date DATE NOT NULL, -- e.g., Dec 5, 2025
  cycle_end_date DATE NOT NULL, -- e.g., Jan 2, 2026 (28 days later)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, month_number)
);

-- Create deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  deliverable_month_id UUID REFERENCES deliverable_months(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'seo_blog',
    'marketing_video',
    'review_highlight',
    'social_fb',
    'social_x',
    'social_ig',
    'social_tiktok',
    'social_yt',
    'citation',
    'backlink',
    'report_basic',
    'report_expanded',
    'marketing_recommendations'
  )),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'draft', 'in_review', 'approved', 'published')),
  title TEXT,
  content JSONB, -- flexible storage for different content types
  draft_url TEXT, -- preview URL if applicable
  published_url TEXT, -- live URL after publishing
  webflow_item_id TEXT, -- if published to Webflow
  social_post_id TEXT, -- if posted to social media
  scheduled_publish_date DATE, -- when this should be published
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Create citations table
CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE CASCADE,
  directory_name TEXT NOT NULL, -- 'Google Maps', 'Yelp', 'Maps.com', etc.
  listing_url TEXT NOT NULL, -- the URL we created
  nap_verified BOOLEAN DEFAULT false, -- Name, Address, Phone verified
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliverable_months_company ON deliverable_months(company_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_months_status ON deliverable_months(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_company ON deliverables(company_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_month ON deliverables(deliverable_month_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_type ON deliverables(type);
CREATE INDEX IF NOT EXISTS idx_citations_company ON citations(company_id);
CREATE INDEX IF NOT EXISTS idx_citations_deliverable ON citations(deliverable_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deliverables table
DROP TRIGGER IF EXISTS update_deliverables_updated_at ON deliverables;
CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies (Row Level Security)
ALTER TABLE deliverable_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- Policies for deliverable_months
CREATE POLICY "Users can view their company's deliverable months"
  ON deliverable_months FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM companies WHERE id = deliverable_months.company_id));

CREATE POLICY "Service role can manage all deliverable months"
  ON deliverable_months FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for deliverables
CREATE POLICY "Users can view their company's deliverables"
  ON deliverables FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM companies WHERE id = deliverables.company_id));

CREATE POLICY "Service role can manage all deliverables"
  ON deliverables FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for citations
CREATE POLICY "Users can view their company's citations"
  ON citations FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM companies WHERE id = citations.company_id));

CREATE POLICY "Service role can manage all citations"
  ON citations FOR ALL
  USING (auth.role() = 'service_role');
