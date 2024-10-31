-- Create inventory_entries table
CREATE TABLE inventory_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    entry_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT inventory_entries_quantity_check CHECK (quantity != 0),
    CONSTRAINT inventory_entries_type_check CHECK (
        entry_type IN ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'TRANSFER')
    ),
    CONSTRAINT inventory_entries_cost_check CHECK (
        (unit_cost IS NULL AND total_cost IS NULL) OR
        (unit_cost >= 0 AND total_cost >= 0)
    )
);

-- Create indexes
CREATE INDEX idx_inventory_entries_product ON inventory_entries(product_id);
CREATE INDEX idx_inventory_entries_type ON inventory_entries(entry_type);
CREATE INDEX idx_inventory_entries_date ON inventory_entries(created_at);
CREATE INDEX idx_inventory_entries_reference ON inventory_entries(reference_number);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_entries_updated_at
    BEFORE UPDATE ON inventory_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE inventory_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
    ON inventory_entries FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON inventory_entries FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
    ON inventory_entries FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Function to record inventory movement
CREATE OR REPLACE FUNCTION record_inventory_movement(
    p_product_id UUID,
    p_entry_type VARCHAR,
    p_quantity INTEGER,
    p_unit_cost DECIMAL = NULL,
    p_reference_number VARCHAR = NULL,
    p_notes TEXT = NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_cost DECIMAL;
    v_entry_id UUID;
BEGIN
    -- Calculate total cost if unit cost is provided
    IF p_unit_cost IS NOT NULL THEN
        v_total_cost := p_unit_cost * ABS(p_quantity);
    END IF;

    -- Insert inventory entry
    INSERT INTO inventory_entries (
        product_id,
        entry_type,
        quantity,
        unit_cost,
        total_cost,
        reference_number,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_entry_type,
        p_quantity,
        p_unit_cost,
        v_total_cost,
        p_reference_number,
        p_notes,
        auth.uid()
    )
    RETURNING id INTO v_entry_id;

    -- Update product stock
    UPDATE products
    SET stock = stock + p_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;

    RETURN v_entry_id;
END;
$$;

-- Function to get inventory movements for a product
CREATE OR REPLACE FUNCTION get_inventory_movements(
    p_product_id UUID,
    p_start_date TIMESTAMP = NULL,
    p_end_date TIMESTAMP = NULL
)
RETURNS TABLE (
    entry_id UUID,
    entry_type VARCHAR,
    quantity INTEGER,
    unit_cost DECIMAL,
    total_cost DECIMAL,
    reference_number VARCHAR,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        entry_type,
        quantity,
        unit_cost,
        total_cost,
        reference_number,
        notes,
        created_at
    FROM inventory_entries
    WHERE product_id = p_product_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
    ORDER BY created_at DESC;
END;
$$;

-- Function to get current stock value
CREATE OR REPLACE FUNCTION get_stock_value(
    p_product_id UUID = NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    current_stock INTEGER,
    average_cost DECIMAL,
    total_value DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH last_costs AS (
        SELECT DISTINCT ON (product_id)
            product_id,
            unit_cost
        FROM inventory_entries
        WHERE unit_cost IS NOT NULL
        AND (p_product_id IS NULL OR product_id = p_product_id)
        ORDER BY product_id, created_at DESC
    )
    SELECT 
        p.id,
        p.name,
        p.stock,
        lc.unit_cost,
        p.stock * lc.unit_cost AS total_value
    FROM products p
    LEFT JOIN last_costs lc ON lc.product_id = p.id
    WHERE p.stock > 0
    AND (p_product_id IS NULL OR p.id = p_product_id)
    ORDER BY p.name;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE inventory_entries IS 'Stores all inventory movements including purchases, sales, returns, and adjustments';
COMMENT ON COLUMN inventory_entries.entry_type IS 'Type of inventory movement (PURCHASE, SALE, ADJUSTMENT, RETURN, TRANSFER)';
COMMENT ON COLUMN inventory_entries.quantity IS 'Quantity moved (positive for additions, negative for reductions)';
COMMENT ON COLUMN inventory_entries.unit_cost IS 'Cost per unit for the movement';
COMMENT ON COLUMN inventory_entries.total_cost IS 'Total cost of the movement';
COMMENT ON COLUMN inventory_entries.reference_number IS 'Reference number (e.g., PO number, invoice number)';

-- Grant permissions
GRANT ALL ON inventory_entries TO authenticated;