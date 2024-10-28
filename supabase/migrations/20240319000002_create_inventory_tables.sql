-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    amount_tendered DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL,
    reference_number VARCHAR(100),
    authorization_code VARCHAR(100),
    metadata JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT payments_amounts_check CHECK (
        amount >= 0 AND
        amount_tendered >= 0 AND
        change_amount >= 0 AND
        amount_tendered >= amount
    ),
    CONSTRAINT payments_method_check CHECK (
        payment_method IN ('CASH', 'CARD', 'TRANSFER', 'CREDIT')
    ),
    CONSTRAINT payments_status_check CHECK (
        status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')
    )
);

-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    payment_id UUID REFERENCES payments(id),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT invoices_amounts_check CHECK (
        subtotal >= 0 AND
        tax_amount >= 0 AND
        total_amount >= 0 AND
        total_amount = subtotal + tax_amount
    ),
    CONSTRAINT invoices_status_check CHECK (
        status IN ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED')
    )
);

-- Create invoice_items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT invoice_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT invoice_items_amounts_check CHECK (
        unit_price >= 0 AND
        tax_rate >= 0 AND
        tax_amount >= 0 AND
        subtotal >= 0 AND
        total >= 0 AND
        total = subtotal + tax_amount
    )
);

-- Create product_types table
CREATE TABLE product_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    
    CONSTRAINT product_types_name_unique UNIQUE (name)
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    barcode VARCHAR(100) UNIQUE,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    type_id UUID REFERENCES product_types(id),
    category_id UUID REFERENCES categories(id),
    tax_rate DECIMAL(5,2) DEFAULT 0.18,
    unit_measure VARCHAR(50),
    brand VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    
    CONSTRAINT products_stock_check CHECK (stock >= 0),
    CONSTRAINT products_min_stock_check CHECK (min_stock >= 0),
    CONSTRAINT products_max_stock_check CHECK (max_stock IS NULL OR max_stock >= min_stock),
    CONSTRAINT products_price_check CHECK (price >= 0),
    CONSTRAINT products_cost_check CHECK (cost IS NULL OR cost >= 0)
);

-- Create product_photos table
CREATE TABLE product_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    
    CONSTRAINT product_photos_display_order_check CHECK (display_order >= 0)
);

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
    CONSTRAINT inventory_entries_type_check CHECK (entry_type IN ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'TRANSFER'))
);

-- Create indexes
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_payment ON invoices(payment_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_type ON products(type_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_inventory_entries_product ON inventory_entries(product_id);
CREATE INDEX idx_inventory_entries_date ON inventory_entries(created_at);
CREATE INDEX idx_product_photos_product ON product_photos(product_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_types_updated_at
    BEFORE UPDATE ON product_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_photos_updated_at
    BEFORE UPDATE ON product_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_entries_updated_at
    BEFORE UPDATE ON inventory_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON invoice_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON product_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON product_photos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON inventory_entries
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admin policies for all operations
CREATE POLICY "Enable all access for admins" ON payments
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all access for admins" ON invoices
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all access for admins" ON invoice_items
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all access for admins" ON product_types
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all access for admins" ON products
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all access for admins" ON product_photos
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all access for admins" ON inventory_entries
    USING (auth.jwt() ->> 'role' = 'admin');

-- Comments for documentation
COMMENT ON TABLE payments IS 'Stores payment transactions for invoices';
COMMENT ON TABLE invoices IS 'Stores invoice header information';
COMMENT ON TABLE invoice_items IS 'Stores individual line items for each invoice';
COMMENT ON TABLE product_types IS 'Stores different types/categories of products';
COMMENT ON TABLE products IS 'Main products table with inventory tracking';
COMMENT ON TABLE product_photos IS 'Stores product images and their display order';
COMMENT ON TABLE inventory_entries IS 'Tracks all inventory movements (purchases, sales, adjustments)';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;