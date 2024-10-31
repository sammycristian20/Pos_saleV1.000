-- Add client_type column to customers table
ALTER TABLE customers 
ADD COLUMN client_type VARCHAR(10) NOT NULL DEFAULT 'PERSONAL' 
CHECK (client_type IN ('PERSONAL', 'BUSINESS'));

-- Update document_type constraint to enforce business rules
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_document_type_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_document_type_check 
CHECK (
  (client_type = 'PERSONAL' AND document_type IN ('CEDULA', 'PASSPORT')) OR
  (client_type = 'BUSINESS' AND document_type = 'RNC')
);

-- Add document format validation
ALTER TABLE customers 
ADD CONSTRAINT customers_document_format_check 
CHECK (
  (document_type = 'RNC' AND document ~ '^[0-9]{9}$') OR
  (document_type = 'CEDULA' AND document ~ '^\d{3}-\d{7}-\d{1}$') OR
  (document_type = 'PASSPORT' AND length(document) >= 6)
);

-- Add comments for documentation
COMMENT ON COLUMN customers.client_type IS 'Type of client: PERSONAL for individuals, BUSINESS for companies';
COMMENT ON CONSTRAINT customers_document_type_check ON customers IS 'Ensures correct document types based on client type';
COMMENT ON CONSTRAINT customers_document_format_check ON customers IS 'Validates document number format based on type';