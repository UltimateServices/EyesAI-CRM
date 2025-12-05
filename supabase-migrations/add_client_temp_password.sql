-- Add client_temp_password column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS client_temp_password TEXT;

-- Add comment for documentation
COMMENT ON COLUMN companies.client_temp_password IS 'Temporary password for client portal login (generated once and stored)';
