-- Create product_discounts table for product-specific discounts
CREATE TABLE product_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT product_discounts_unique UNIQUE (product_id, discount_id)
);

-- Enable RLS
ALTER TABLE product_discounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON product_discounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON product_discounts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON product_discounts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON product_discounts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_product_discounts_product ON product_discounts(product_id);
CREATE INDEX idx_product_discounts_discount ON product_discounts(discount_id);

-- Add trigger for updated_at
CREATE TRIGGER update_product_discounts_updated_at
    BEFORE UPDATE ON product_discounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON product_discounts TO authenticated;