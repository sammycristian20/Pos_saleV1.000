-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('vendedor', 'admin', 'contador')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    client_type VARCHAR(10) NOT NULL DEFAULT 'PERSONAL' CHECK (client_type IN ('PERSONAL', 'BUSINESS')),
    document VARCHAR(20) NOT NULL,
    document_type VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT customers_document_unique UNIQUE (document),
    CONSTRAINT customers_email_unique UNIQUE (email),
    CONSTRAINT customers_document_type_check CHECK (
        (client_type = 'PERSONAL' AND document_type IN ('CEDULA', 'PASSPORT')) OR
        (client_type = 'BUSINESS' AND document_type = 'RNC')
    ),
    CONSTRAINT customers_document_format_check CHECK (
        (document_type = 'RNC' AND document ~ '^[0-9]{9}$') OR
        (document_type = 'CEDULA' AND document ~ '^\d{3}-\d{7}-\d{1}$') OR
        (document_type = 'PASSPORT' AND length(document) >= 6)
    )
);

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
    created_by UUID REFERENCES users(id),
    active BOOLEAN DEFAULT true,
    email VARCHAR(255)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

CREATE INDEX IF NOT EXISTS idx_sellers_name ON sellers(name);
CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email);
CREATE INDEX IF NOT EXISTS idx_sellers_hire_date ON sellers(hire_date);
CREATE INDEX IF NOT EXISTS idx_sellers_created_at ON sellers(created_at);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sellers_updated_at
    BEFORE UPDATE ON sellers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for users
CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON users
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS Policies for customers
CREATE POLICY "Enable read access for authenticated users" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS Policies for sellers
CREATE POLICY "Enable read access for authenticated users" ON sellers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON sellers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON sellers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts and authentication information';
COMMENT ON TABLE customers IS 'Stores customer information for both personal and business clients';
COMMENT ON TABLE sellers IS 'Stores information about sales representatives';

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON sellers TO authenticated;