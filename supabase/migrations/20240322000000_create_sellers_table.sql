-- Create sellers table
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
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
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT sellers_user_unique UNIQUE (user_id)
);

-- Create trigger for updated_at
CREATE TRIGGER update_sellers_updated_at
    BEFORE UPDATE ON sellers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create indexes
CREATE INDEX idx_sellers_name ON sellers(name);
CREATE INDEX idx_sellers_user ON sellers(user_id);
CREATE INDEX idx_sellers_hire_date ON sellers(hire_date);

-- Add comments for documentation
COMMENT ON TABLE sellers IS 'Stores information about sales representatives';
COMMENT ON COLUMN sellers.user_id IS 'Link to users table';
COMMENT ON COLUMN sellers.hire_date IS 'Date when the seller was hired';
COMMENT ON COLUMN sellers.salary IS 'Monthly salary amount';
COMMENT ON COLUMN sellers.contract_type IS 'Type of employment contract';
COMMENT ON COLUMN sellers.birth_date IS 'Seller birth date';

-- Grant permissions
GRANT ALL ON sellers TO authenticated;