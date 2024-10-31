-- Create taxes table
CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
    description TEXT,
    applies_to VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT taxes_name_unique UNIQUE (name)
);

-- Create product_taxes table for product-specific tax assignments
CREATE TABLE product_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tax_id UUID NOT NULL REFERENCES taxes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT product_taxes_unique UNIQUE (product_id, tax_id)
);

-- Add discount columns to invoice_items table
ALTER TABLE invoice_items 
ADD COLUMN discount_id UUID REFERENCES discounts(id),
ADD COLUMN item_discount_id UUID REFERENCES discounts(id);

-- Create indexes
CREATE INDEX idx_taxes_name ON taxes(name);
CREATE INDEX idx_taxes_active ON taxes(active);
CREATE INDEX idx_taxes_rate ON taxes(rate);
CREATE INDEX idx_product_taxes_product ON product_taxes(product_id);
CREATE INDEX idx_product_taxes_tax ON product_taxes(tax_id);
CREATE INDEX idx_invoice_items_discount ON invoice_items(discount_id);
CREATE INDEX idx_invoice_items_item_discount ON invoice_items(item_discount_id);

-- Create updated_at trigger for taxes
CREATE TRIGGER update_taxes_updated_at
    BEFORE UPDATE ON taxes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_taxes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for taxes
CREATE POLICY "Enable read access for authenticated users" ON taxes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON taxes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON taxes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON taxes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for product_taxes
CREATE POLICY "Enable read access for authenticated users" ON product_taxes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON product_taxes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON product_taxes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON taxes TO authenticated;
GRANT ALL ON product_taxes TO authenticated;

-- Insert default ITBIS tax
INSERT INTO taxes (
    name,
    rate,
    description,
    applies_to,
    active,
    created_by
) VALUES (
    'ITBIS',
    18.00,
    'Impuesto sobre Transferencias de Bienes Industrializados y Servicios',
    'Productos y servicios generales',
    true,
    auth.uid()
) ON CONFLICT (name) DO NOTHING;

-- Function to assign tax to product
CREATE OR REPLACE FUNCTION assign_tax_to_product(
    p_product_id UUID,
    p_tax_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO product_taxes (
        product_id,
        tax_id,
        created_by
    ) VALUES (
        p_product_id,
        p_tax_id,
        auth.uid()
    ) ON CONFLICT (product_id, tax_id) DO NOTHING;
    
    RETURN FOUND;
END;
$$;

-- Function to get product taxes
CREATE OR REPLACE FUNCTION get_product_taxes(p_product_id UUID)
RETURNS TABLE (
    tax_id UUID,
    tax_name VARCHAR(100),
    tax_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.rate
    FROM taxes t
    JOIN product_taxes pt ON pt.tax_id = t.id
    WHERE pt.product_id = p_product_id
    AND t.active = true;
END;
$$;

-- Function to calculate tax amount
CREATE OR REPLACE FUNCTION calculate_tax_amount(
    p_base_amount DECIMAL,
    p_tax_rate DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN ROUND((p_base_amount * (p_tax_rate / 100))::numeric, 2);
END;
$$;