-- Create sellers table
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(12) CHECK (phone ~ '^\d{3}-\d{3}-\d{4}$'),
    address TEXT NOT NULL,
    photo_url TEXT,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2) NOT NULL CHECK (salary >= 0),
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACTOR')),
    birth_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    active BOOLEAN DEFAULT true,
    email VARCHAR(255) UNIQUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sellers_name ON sellers(name);
CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email);
CREATE INDEX IF NOT EXISTS idx_sellers_hire_date ON sellers(hire_date);
CREATE INDEX IF NOT EXISTS idx_sellers_created_at ON sellers(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_sellers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sellers_updated_at
    BEFORE UPDATE ON sellers
    FOR EACH ROW
    EXECUTE FUNCTION update_sellers_updated_at();

-- Enable Row Level Security
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for authenticated users"
    ON sellers FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON sellers FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
    ON sellers FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
    ON sellers FOR DELETE
    USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE sellers IS 'Stores information about sales representatives';
COMMENT ON COLUMN sellers.name IS 'Full name of the seller';
COMMENT ON COLUMN sellers.phone IS 'Contact phone number in format XXX-XXX-XXXX';
COMMENT ON COLUMN sellers.address IS 'Physical address of the seller';
COMMENT ON COLUMN sellers.photo_url IS 'URL to seller profile photo';
COMMENT ON COLUMN sellers.hire_date IS 'Date when the seller was hired';
COMMENT ON COLUMN sellers.salary IS 'Monthly salary amount';
COMMENT ON COLUMN sellers.contract_type IS 'Type of employment contract';
COMMENT ON COLUMN sellers.birth_date IS 'Seller birth date';
COMMENT ON COLUMN sellers.email IS 'Unique email address for the seller';

-- Grant permissions
GRANT ALL ON sellers TO authenticated;