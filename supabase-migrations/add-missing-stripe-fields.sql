-- Add missing fields that come from Stripe checkout
-- These fields are needed to properly store customer information from Stripe

-- Add zipcode column
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS zipcode VARCHAR(20);

-- Add contact_name column (for the person's name, separate from business name)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);

-- Add package_type column (to differentiate from plan if needed)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS package_type VARCHAR(50);

-- Add comment to document these fields
COMMENT ON COLUMN companies.zipcode IS 'Postal/ZIP code from Stripe customer address';
COMMENT ON COLUMN companies.contact_name IS 'Contact person name from Stripe checkout';
COMMENT ON COLUMN companies.package_type IS 'Package type from Stripe metadata (DISCOVER, VERIFIED, etc)';
