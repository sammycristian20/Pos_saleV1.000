-- Create company_settings table
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rnc VARCHAR(9) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(12) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    -- Add constraints
    CONSTRAINT company_settings_rnc_check CHECK (rnc ~ '^\d{9}$'),
    CONSTRAINT company_settings_phone_check CHECK (phone ~ '^\d{3}-\d{3}-\d{4}$'),
    CONSTRAINT company_settings_email_check CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
    ON company_settings FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON company_settings FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
    ON company_settings FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE company_settings IS 'Stores company configuration and details';
COMMENT ON COLUMN company_settings.name IS 'Company name';
COMMENT ON COLUMN company_settings.rnc IS 'Company RNC (tax ID)';
COMMENT ON COLUMN company_settings.address IS 'Company physical address';
COMMENT ON COLUMN company_settings.phone IS 'Company contact phone';
COMMENT ON COLUMN company_settings.email IS 'Company contact email';

-- Grant permissions
GRANT ALL ON company_settings TO authenticated;