-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if exists (be careful with this in production)
DROP TABLE IF EXISTS customers;

-- Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20) NOT NULL,
    document_type VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    
    -- Add constraints
    CONSTRAINT customers_document_unique UNIQUE (document),
    CONSTRAINT customers_email_unique UNIQUE (email),
    CONSTRAINT customers_document_type_check CHECK (document_type IN ('CEDULA', 'RNC', 'PASSPORT'))
);

-- Create index for faster searches
CREATE INDEX idx_customers_document ON customers(document);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy for select
CREATE POLICY "Enable read access for authenticated users" ON customers
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create policy for insert
CREATE POLICY "Enable insert access for authenticated users" ON customers
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create policy for update
CREATE POLICY "Enable update access for authenticated users" ON customers
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create policy for delete
CREATE POLICY "Enable delete access for authenticated users" ON customers
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE customers IS 'Stores customer information for the POS system';
COMMENT ON COLUMN customers.id IS 'Unique identifier for the customer';
COMMENT ON COLUMN customers.name IS 'Customer full name or company name';
COMMENT ON COLUMN customers.document IS 'Customer identification number (Cédula, RNC, or Passport)';
COMMENT ON COLUMN customers.document_type IS 'Type of identification document (CEDULA, RNC, PASSPORT)';
COMMENT ON COLUMN customers.phone IS 'Customer contact phone number';
COMMENT ON COLUMN customers.email IS 'Customer email address';
COMMENT ON COLUMN customers.address IS 'Customer physical address';
COMMENT ON COLUMN customers.created_at IS 'Timestamp when the customer record was created';
COMMENT ON COLUMN customers.updated_at IS 'Timestamp when the customer record was last updated';
COMMENT ON COLUMN customers.active IS 'Flag indicating if the customer is active';