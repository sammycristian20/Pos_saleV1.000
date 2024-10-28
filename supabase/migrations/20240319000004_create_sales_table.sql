-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT sales_amounts_check CHECK (
        subtotal >= 0 AND
        tax_amount >= 0 AND
        total_amount >= 0 AND
        total_amount = subtotal + tax_amount AND
        amount_paid >= total_amount AND
        change_amount = amount_paid - total_amount
    ),
    CONSTRAINT sales_payment_method_check CHECK (
        payment_method IN ('CASH', 'CARD', 'TRANSFER', 'CREDIT')
    ),
    CONSTRAINT sales_status_check CHECK (
        status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED')
    )
);

-- Create sale_items table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT sale_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT sale_items_amounts_check CHECK (
        unit_price >= 0 AND
        tax_rate >= 0 AND
        tax_amount >= 0 AND
        subtotal >= 0 AND
        total >= 0 AND
        total = subtotal + tax_amount AND
        subtotal = quantity * unit_price AND
        tax_amount = subtotal * tax_rate
    )
);

-- Create indexes
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for authenticated users"
    ON sales
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON sales
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
    ON sales
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
    ON sales
    FOR DELETE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
    ON sale_items
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON sale_items
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create function to process a sale
CREATE OR REPLACE FUNCTION create_sale(sale_data json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_sale_id UUID;
    item json;
    current_stock INTEGER;
BEGIN
    -- Start transaction
    BEGIN
        -- Insert sale record
        INSERT INTO sales (
            customer_id,
            subtotal,
            tax_amount,
            total_amount,
            payment_method,
            amount_paid,
            change_amount,
            status,
            created_by
        )
        VALUES (
            (sale_data->>'customer_id')::UUID,
            (sale_data->>'subtotal')::DECIMAL,
            (sale_data->>'tax_amount')::DECIMAL,
            (sale_data->>'total_amount')::DECIMAL,
            sale_data->>'payment_method',
            (sale_data->>'amount_paid')::DECIMAL,
            (sale_data->>'change_amount')::DECIMAL,
            'COMPLETED',
            auth.uid()
        )
        RETURNING id INTO new_sale_id;

        -- Process each sale item
        FOR item IN SELECT * FROM json_array_elements((sale_data->>'items')::json)
        LOOP
            -- Check stock availability
            SELECT stock INTO current_stock
            FROM products
            WHERE id = (item->>'product_id')::UUID
            FOR UPDATE;

            IF current_stock < (item->>'quantity')::INTEGER THEN
                RAISE EXCEPTION 'Insufficient stock for product %', (item->>'product_id')::UUID;
            END IF;

            -- Insert sale item
            INSERT INTO sale_items (
                sale_id,
                product_id,
                quantity,
                unit_price,
                tax_rate,
                tax_amount,
                subtotal,
                total
            )
            VALUES (
                new_sale_id,
                (item->>'product_id')::UUID,
                (item->>'quantity')::INTEGER,
                (item->>'unit_price')::DECIMAL,
                (item->>'tax_rate')::DECIMAL,
                (item->>'tax_amount')::DECIMAL,
                (item->>'subtotal')::DECIMAL,
                (item->>'total')::DECIMAL
            );

            -- Update product stock
            UPDATE products
            SET stock = stock - (item->>'quantity')::INTEGER
            WHERE id = (item->>'product_id')::UUID;
        END LOOP;

        -- Return the created sale data
        RETURN json_build_object(
            'id', new_sale_id,
            'status', 'success'
        );
    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on any error
        RAISE EXCEPTION 'Sale creation failed: %', SQLERRM;
    END;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE sales IS 'Stores sales transactions';
COMMENT ON TABLE sale_items IS 'Stores individual items for each sale';
COMMENT ON COLUMN sales.customer_id IS 'Reference to the customer who made the purchase';
COMMENT ON COLUMN sales.subtotal IS 'Sum of all items before tax';
COMMENT ON COLUMN sales.tax_amount IS 'Total tax amount for the sale';
COMMENT ON COLUMN sales.total_amount IS 'Final amount including tax';
COMMENT ON COLUMN sales.payment_method IS 'Method of payment (CASH, CARD, TRANSFER, CREDIT)';
COMMENT ON COLUMN sales.status IS 'Current status of the sale';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON sales TO authenticated;
GRANT SELECT, INSERT ON sale_items TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;