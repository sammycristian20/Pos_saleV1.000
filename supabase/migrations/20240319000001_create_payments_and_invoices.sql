-- Create sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10,2) NOT NULL CHECK (tax_amount >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'CREDIT')),
  amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid >= 0),
  change_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT sale_amounts_check CHECK (
    total_amount = subtotal + tax_amount AND
    amount_paid >= total_amount - change_amount
  )
);

-- Create sale_items table
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  tax_rate DECIMAL(5,2) NOT NULL CHECK (tax_rate >= 0),
  tax_amount DECIMAL(10,2) NOT NULL CHECK (tax_amount >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT sale_items_amounts_check CHECK (
    subtotal = quantity * unit_price AND
    tax_amount = subtotal * tax_rate AND
    total = subtotal + tax_amount
  )
);

-- Create function to handle sale creation
CREATE OR REPLACE FUNCTION create_sale(sale_data json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_sale_id UUID;
  item json;
  current_stock int;
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
      (sale_data->>'customer_id')::uuid,
      (sale_data->>'subtotal')::decimal,
      (sale_data->>'tax_amount')::decimal,
      (sale_data->>'total_amount')::decimal,
      sale_data->>'payment_method',
      (sale_data->>'amount_paid')::decimal,
      (sale_data->>'change_amount')::decimal,
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
      WHERE id = (item->>'product_id')::uuid
      FOR UPDATE;

      IF current_stock < (item->>'quantity')::int THEN
        RAISE EXCEPTION 'Insufficient stock for product %', (item->>'product_id')::uuid;
      END IF;

      -- Insert sale item with properly calculated values
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
      SELECT
        new_sale_id,
        (item->>'product_id')::uuid,
        (item->>'quantity')::int,
        (item->>'unit_price')::decimal,
        (item->>'tax_rate')::decimal,
        ROUND(((item->>'quantity')::int * (item->>'unit_price')::decimal * (item->>'tax_rate')::decimal)::numeric, 2),
        ROUND(((item->>'quantity')::int * (item->>'unit_price')::decimal)::numeric, 2),
        ROUND(((item->>'quantity')::int * (item->>'unit_price')::decimal * (1 + (item->>'tax_rate')::decimal))::numeric, 2);

      -- Update product stock
      UPDATE products
      SET stock = stock - (item->>'quantity')::int
      WHERE id = (item->>'product_id')::uuid;
    END LOOP;

    -- Return the created sale data
    RETURN json_build_object(
      'id', new_sale_id,
      'status', 'success'
    );
  EXCEPTION
    WHEN others THEN
      -- Rollback transaction on any error
      RAISE EXCEPTION 'Sale creation failed: %', SQLERRM;
  END;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
  ON sales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
  ON sales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
  ON sales FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
  ON sale_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
  ON sale_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON sales TO authenticated;
GRANT SELECT, INSERT ON sale_items TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;