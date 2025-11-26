-- Create media_items table for shared media gallery between client and worker portals
CREATE TABLE IF NOT EXISTS media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- File info
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  file_size INTEGER NOT NULL,
  mime_type TEXT,

  -- Client-facing category (simple)
  category TEXT NOT NULL CHECK (category IN ('logo', 'photo', 'video')),

  -- VA/Worker internal tags (detailed)
  internal_tags TEXT[] DEFAULT '{}',

  -- Ordering
  priority INTEGER DEFAULT 0,

  -- Upload tracking
  uploaded_by_type TEXT NOT NULL CHECK (uploaded_by_type IN ('worker', 'client')),
  uploaded_by_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_media_items_company_id ON media_items(company_id);
CREATE INDEX idx_media_items_organization_id ON media_items(organization_id);
CREATE INDEX idx_media_items_category ON media_items(category);
CREATE INDEX idx_media_items_file_type ON media_items(file_type);

-- RLS Policies
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- Workers can view/manage all media in their organization
CREATE POLICY "Workers can view org media" ON media_items
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can insert org media" ON media_items
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can update org media" ON media_items
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can delete org media" ON media_items
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Clients can view their own company's media
CREATE POLICY "Clients can view their media" ON media_items
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE id = company_id
    )
  );

-- Clients can insert media for their company
CREATE POLICY "Clients can insert their media" ON media_items
  FOR INSERT WITH CHECK (
    uploaded_by_type = 'client' AND
    uploaded_by_id = auth.uid()
  );

-- Clients can delete their own uploads
CREATE POLICY "Clients can delete their uploads" ON media_items
  FOR DELETE USING (
    uploaded_by_type = 'client' AND
    uploaded_by_id = auth.uid()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_media_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_items_updated_at
  BEFORE UPDATE ON media_items
  FOR EACH ROW
  EXECUTE FUNCTION update_media_items_updated_at();
