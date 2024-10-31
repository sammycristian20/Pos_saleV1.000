-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE fiscal_document_type AS ENUM (
    'CREDITO_FISCAL',      -- 31
    'CONSUMO',            -- 32
    'NOTA_DEBITO',       -- 33
    'NOTA_CREDITO',      -- 34
    'COMPRAS',           -- 41
    'GASTOS_MENORES',    -- 43
    'REGIMENES_ESPECIALES', -- 44
    'GUBERNAMENTAL'      -- 45
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('vendedor', 'admin', 'contador')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE customers (
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

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    image_url TEXT,
    slug VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    
    CONSTRAINT categories_name_unique UNIQUE (name),
    CONSTRAINT categories_slug_unique UNIQUE (slug),
    CONSTRAINT categories_display_order_check CHECK (display_order >= 0),
    CONSTRAINT categories_no_self_parent CHECK (id != parent_id)
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    barcode VARCHAR(100) UNIQUE,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10,2) CHECK (cost >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER DEFAULT 0 CHECK (min_stock >= 0),
    category_id UUID REFERENCES categories(id),
    tax_rate DECIMAL(5,2) DEFAULT 0.18,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true
);

-- Create product_photos table
CREATE TABLE product_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- Create product_discounts table
CREATE TABLE product_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT product_discounts_unique UNIQUE (product_id, discount_id)
);

-- Create fiscal_sequences table
CREATE TABLE fiscal_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type fiscal_document_type NOT NULL,
    current_prefix VARCHAR(3) NOT NULL,
    last_number BIGINT NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fiscal_sequences_last_number_check CHECK (last_number >= 0 AND last_number <= 9999999999),
    CONSTRAINT fiscal_sequences_prefix_check CHECK (current_prefix ~ '^E\d{2}$')
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'CREDIT')),
    amount_tendered DECIMAL(10,2) NOT NULL CHECK (amount_tendered >= 0),
    change_amount DECIMAL(10,2) NOT NULL CHECK (change_amount >= 0),
    reference_number VARCHAR(100),
    authorization_code VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    payment_id UUID REFERENCES payments(id),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) NOT NULL CHECK (tax_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    discount_id UUID REFERENCES discounts(id),
    fiscal_document_type fiscal_document_type,
    fiscal_number VARCHAR(13) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT invoices_amounts_check CHECK (
        total_amount = subtotal - discount_amount + tax_amount
    )
);

-- Create invoice_items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    tax_rate DECIMAL(5,2) NOT NULL CHECK (tax_rate >= 0),
    tax_amount DECIMAL(10,2) NOT NULL CHECK (tax_amount >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT invoice_items_amounts_check CHECK (
        subtotal = quantity * unit_price AND
        total = subtotal - discount_amount + tax_amount
    )
);

-- Create fiscal_sequence_usage table
CREATE TABLE fiscal_sequence_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    fiscal_sequence_id UUID NOT NULL REFERENCES fiscal_sequences(id),
    fiscal_number VARCHAR(13) NOT NULL,
    document_type fiscal_document_type NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    voided BOOLEAN DEFAULT false,
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by UUID REFERENCES users(id),
    void_reason TEXT,
    
    CONSTRAINT fiscal_sequence_usage_fiscal_number_unique UNIQUE (fiscal_number),
    CONSTRAINT fiscal_sequence_usage_invoice_unique UNIQUE (invoice_id)
);

-- Create company_settings table
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rnc VARCHAR(9) NOT NULL CHECK (rnc ~ '^\d{9}$'),
    address TEXT NOT NULL,
    phone VARCHAR(12) NOT NULL CHECK (phone ~ '^\d{3}-\d{3}-\d{4}$'),
    email VARCHAR(255) NOT NULL CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_customers_document ON customers(document);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_product_photos_product ON product_photos(product_id);
CREATE INDEX idx_discounts_active ON discounts(active);
CREATE INDEX idx_discounts_dates ON discounts(start_date, end_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_fiscal_number ON invoices(fiscal_number);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at
    BEFORE UPDATE ON discounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create get_next_fiscal_number function
CREATE OR REPLACE FUNCTION get_next_fiscal_number(p_document_type fiscal_document_type)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sequence RECORD;
    v_next_number BIGINT;
    v_fiscal_number TEXT;
BEGIN
    SELECT * INTO v_sequence
    FROM fiscal_sequences
    WHERE document_type = p_document_type
      AND active = true
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active sequence found for document type %', p_document_type;
    END IF;
    
    v_next_number := v_sequence.last_number + 1;
    
    IF v_next_number > 9999999999 THEN
        RAISE EXCEPTION 'Sequence limit reached for document type %', p_document_type;
    END IF;
    
    UPDATE fiscal_sequences
    SET last_number = v_next_number,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_sequence.id;
    
    v_fiscal_number := v_sequence.current_prefix || lpad(v_next_number::text, 10, '0');
    
    RETURN v_fiscal_number;
END;
$$;

-- Create create_sale function
CREATE OR REPLACE FUNCTION create_sale(sale_data json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_payment_id uuid;
    new_invoice_id uuid;
    fiscal_sequence_id uuid;
    fiscal_number text;
    item json;
    current_stock integer;
BEGIN
    BEGIN
        INSERT INTO payments (
            amount,
            payment_method,
            amount_tendered,
            change_amount,
            reference_number,
            authorization_code,
            status,
            created_by
        )
        VALUES (
            (sale_data->>'total_amount')::decimal,
            sale_data->>'payment_method',
            (sale_data->>'amount_paid')::decimal,
            (sale_data->>'change_amount')::decimal,
            sale_data->>'reference_number',
            sale_data->>'authorization_code',
            'COMPLETED',
            auth.uid()
        )
        RETURNING id INTO new_payment_id;

        SELECT id INTO fiscal_sequence_id
        FROM fiscal_sequences
        WHERE document_type = (sale_data->>'fiscal_document_type')::fiscal_document_type
        AND active = true
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'No active sequence found for document type %', (sale_data->>'fiscal_document_type');
        END IF;

        SELECT current_prefix || lpad((last_number + 1)::text, 10, '0')
        INTO fiscal_number
        FROM fiscal_sequences
        WHERE id = fiscal_sequence_id;

        INSERT INTO invoices (
            customer_id,
            payment_id,
            subtotal,
            tax_amount,
            total_amount,
            discount_amount,
            discount_id,
            fiscal_document_type,
            fiscal_number,
            status,
            created_by
        )
        VALUES (
            (sale_data->>'customer_id')::uuid,
            new_payment_id,
            (sale_data->>'subtotal')::decimal,
            (sale_data->>'tax_amount')::decimal,
            (sale_data->>'total_amount')::decimal,
            (sale_data->>'discount_amount')::decimal,
            (sale_data->>'discount_id')::uuid,
            (sale_data->>'fiscal_document_type')::fiscal_document_type,
            fiscal_number,
            'PAID',
            auth.uid()
        )
        RETURNING id INTO new_invoice_id;

        UPDATE fiscal_sequences
        SET last_number = last_number + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = fiscal_sequence_id;

        INSERT INTO fiscal_sequence_usage (
            invoice_id,
            fiscal_sequence_id,
            fiscal_number,
            document_type,
            created_by
        )
        VALUES (
            new_invoice_id,
            fiscal_sequence_id,
            fiscal_number,
            (sale_data->>'fiscal_document_type')::fiscal_document_type,
            auth.uid()
        );

        FOR item IN SELECT * FROM json_array_elements((sale_data->>'items')::json)
        LOOP
            SELECT stock INTO current_stock
            FROM products
            WHERE id = (item->>'product_id')::uuid
            FOR UPDATE;

            IF current_stock < (item->>'quantity')::integer THEN
                RAISE EXCEPTION 'Insufficient stock for product %', (item->>'product_id')::uuid;
            END IF;

            INSERT INTO invoice_items (
                invoice_id,
                product_id,
                quantity,
                unit_price,
                tax_rate,
                tax_amount,
                subtotal,
                total,
                discount_amount
            )
            VALUES (
                new_invoice_id,
                (item->>'product_id')::uuid,
                (item->>'quantity')::integer,
                (item->>'unit_price')::decimal,
                (item->>'tax_rate')::decimal,
                (item->>'tax_amount')::decimal,
                (item->>'subtotal')::decimal,
                (item->>'total')::decimal,
                (item->>'discount_amount')::decimal
            );

            UPDATE products
            SET stock = stock - (item->>'quantity')::integer
            WHERE id = (item->>'product_id')::uuid;
        END LOOP;

        RETURN json_build_object(
            'payment_id', new_payment_id,
            'invoice_id', new_invoice_id,
            'fiscal_number', fiscal_number,
            'status', 'success'
        );

    EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Sale creation failed: %', sqlerrm;
    END;
END;
$$;

-- Insert default customer (Consumidor Final)
INSERT INTO customers (
    id,
    name,
    document,
    document_type,
    client_type,
    created_at,
    updated_at,
    active
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Consumidor Final',
    '000-0000000-0',
    'CEDULA',
    'PERSONAL',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert initial fiscal sequences
INSERT INTO fiscal_sequences (document_type, current_prefix) VALUES
    ('CREDITO_FISCAL', 'E31'),
    ('CONSUMO', 'E32'),
    ('NOTA_DEBITO', 'E33'),
    ('NOTA_CREDITO', 'E34'),
    ('COMPRAS', 'E41'),
    ('GASTOS_MENORES', 'E43'),
    ('REGIMENES_ESPECIALES', 'E44'),
    ('GUBERNAMENTAL', 'E45')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_sequence_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;