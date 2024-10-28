-- Create discounts table
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
    value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
    active BOOLEAN DEFAULT true,
    min_purchase_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT discounts_value_check CHECK (
        (type = 'PERCENTAGE' AND value <= 100) OR
        (type = 'FIXED')
    ),
    CONSTRAINT discounts_dates_check CHECK (
        (start_date IS NULL AND end_date IS NULL) OR
        (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date)
    )
);

-- Add discount columns to sales and sale_items tables
ALTER TABLE sales
ADD COLUMN discount_id UUID REFERENCES discounts(id),
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0);

ALTER TABLE sale_items
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0);

-- Create indexes
CREATE INDEX idx_discounts_active ON discounts(active);
CREATE INDEX idx_discounts_dates ON discounts(start_date, end_date);
CREATE INDEX idx_discounts_type ON discounts(type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_discounts_updated_at
    BEFORE UPDATE ON discounts
    FOR EACH ROW
    EXECUTE FUNCTION update_discounts_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for authenticated users"
    ON discounts
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON discounts
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
    ON discounts
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
    ON discounts
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE discounts IS 'Stores discount configurations for sales';
COMMENT ON COLUMN discounts.type IS 'Type of discount (PERCENTAGE or FIXED amount)';
COMMENT ON COLUMN discounts.value IS 'Discount value (percentage or fixed amount)';
COMMENT ON COLUMN discounts.min_purchase_amount IS 'Minimum purchase amount required to apply discount';
COMMENT ON COLUMN discounts.max_discount_amount IS 'Maximum discount amount allowed';
COMMENT ON COLUMN discounts.start_date IS 'Start date of discount validity';
COMMENT ON COLUMN discounts.end_date IS 'End date of discount validity';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON discounts TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;