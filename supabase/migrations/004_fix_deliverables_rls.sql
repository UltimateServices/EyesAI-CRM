-- Fix RLS policies to allow authenticated users to manage deliverables

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their company's deliverable months" ON deliverable_months;
DROP POLICY IF EXISTS "Service role can manage all deliverable months" ON deliverable_months;
DROP POLICY IF EXISTS "Users can view their company's deliverables" ON deliverables;
DROP POLICY IF EXISTS "Service role can manage all deliverables" ON deliverables;
DROP POLICY IF EXISTS "Users can view their company's citations" ON citations;
DROP POLICY IF EXISTS "Service role can manage all citations" ON citations;

-- Create new policies that allow authenticated users to manage deliverables
CREATE POLICY "Authenticated users can manage deliverable months"
  ON deliverable_months FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage deliverables"
  ON deliverables FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage citations"
  ON citations FOR ALL
  USING (auth.role() = 'authenticated');
