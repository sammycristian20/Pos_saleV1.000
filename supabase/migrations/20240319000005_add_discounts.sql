-- Create discounts table
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
    value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Add discount columns to invoices
ALTER TABLE invoices 
ADD COLUMN discount_id UUID REFERENCES discounts(id),
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0);

-- Add discount columns to invoice_items
ALTER TABLE invoice_items
ADD COLUMN discount_id UUID REFERENCES discounts(id),
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0);

-- Update the invoice amounts check constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_amounts_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_amounts_check 
CHECK (
    subtotal >= 0 AND
    tax_amount >= 0 AND
    discount_amount >= 0 AND
    total_amount >= 0 AND
    total_amount = subtotal - discount_amount + tax_amount
);

-- Update the invoice_items amounts check constraint
ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_amounts_check;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_amounts_check 
CHECK (
    unit_price >= 0 AND
    tax_rate >= 0 AND
    tax_amount >= 0 AND
    discount_amount >= 0 AND
    subtotal >= 0 AND
    total >= 0 AND
    subtotal = quantity * unit_price AND
    total = subtotal - discount_amount + tax_amount
);

-- Enable RLS for discounts
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for discounts
CREATE POLICY "Enable read access for authenticated users" ON discounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON discounts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON discounts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON discounts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_discounts_name ON discounts(name);
CREATE INDEX idx_discounts_active ON discounts(active);
CREATE INDEX idx_invoices_discount ON invoices(discount_id);
CREATE INDEX idx_invoice_items_discount ON invoice_items(discount_id);

-- Add comments
COMMENT ON TABLE discounts IS 'Stores discount configurations for invoices';
COMMENT ON COLUMN discounts.type IS 'Type of discount: PERCENTAGE or FIXED amount';
COMMENT ON COLUMN discounts.value IS 'Discount value (percentage or fixed amount)';
COMMENT ON COLUMN invoices.discount_id IS 'Reference to the applied discount';
COMMENT ON COLUMN invoices.discount_amount IS 'Total discount amount applied to the invoice';

-- Grant permissions
GRANT ALL ON discounts TO authenticated;