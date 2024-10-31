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

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Create void_fiscal_sequence function
CREATE OR REPLACE FUNCTION void_fiscal_sequence(
    p_invoice_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE fiscal_sequence_usage
    SET voided = true,
        voided_at = CURRENT_TIMESTAMP,
        voided_by = auth.uid(),
        void_reason = p_reason
    WHERE invoice_id = p_invoice_id
      AND NOT voided;
      
    RETURN FOUND;
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
        -- Create payment record
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

        -- Get fiscal sequence
        SELECT id INTO fiscal_sequence_id
        FROM fiscal_sequences
        WHERE document_type = (sale_data->>'fiscal_document_type')::fiscal_document_type
        AND active = true
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'No active sequence found for document type %', (sale_data->>'fiscal_document_type');
        END IF;

        -- Generate fiscal number
        SELECT current_prefix || lpad((last_number + 1)::text, 10, '0')
        INTO fiscal_number
        FROM fiscal_sequences
        WHERE id = fiscal_sequence_id;

        -- Create invoice
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

        -- Update fiscal sequence
        UPDATE fiscal_sequences
        SET last_number = last_number + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = fiscal_sequence_id;

        -- Record fiscal sequence usage
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

        -- Process items
        FOR item IN SELECT * FROM json_array_elements((sale_data->>'items')::json)
        LOOP
            -- Check stock
            SELECT stock INTO current_stock
            FROM products
            WHERE id = (item->>'product_id')::uuid
            FOR UPDATE;

            IF current_stock < (item->>'quantity')::integer THEN
                RAISE EXCEPTION 'Insufficient stock for product %', (item->>'product_id')::uuid;
            END IF;

            -- Create invoice item
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

            -- Update stock
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
        -- Rollback will happen automatically
        RAISE EXCEPTION 'Sale creation failed: %', sqlerrm;
    END;
END;
$$;

-- Create cancel_sale function
CREATE OR REPLACE FUNCTION cancel_sale(invoice_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inv record;
    item record;
BEGIN
    -- Start transaction
    BEGIN
        -- Get invoice details
        SELECT * INTO inv
        FROM invoices
        WHERE id = invoice_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invoice not found';
        END IF;

        IF inv.status != 'PAID' THEN
            RAISE EXCEPTION 'Only paid invoices can be cancelled';
        END IF;

        -- Update invoice status
        UPDATE invoices
        SET status = 'CANCELLED',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = invoice_id;

        -- Update payment status if exists
        IF inv.payment_id IS NOT NULL THEN
            UPDATE payments
            SET status = 'CANCELLED',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = inv.payment_id;
        END IF;

        -- Restore inventory for each item
        FOR item IN
            SELECT ii.*, p.stock
            FROM invoice_items ii
            JOIN products p ON p.id = ii.product_id
            WHERE ii.invoice_id = invoice_id
        LOOP
            -- Update product stock
            UPDATE products
            SET stock = stock + item.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = item.product_id;

            -- Create inventory entry for stock restoration
            INSERT INTO inventory_entries (
                product_id,
                entry_type,
                quantity,
                reference_number,
                notes,
                created_by
            ) VALUES (
                item.product_id,
                'RETURN',
                item.quantity,
                invoice_id::text,
                'Stock restored from cancelled invoice',
                auth.uid()
            );
        END LOOP;

        RETURN json_build_object(
            'success', true,
            'message', 'Invoice cancelled successfully'
        );

    EXCEPTION WHEN others THEN
        -- Rollback will happen automatically
        RAISE EXCEPTION 'Invoice cancellation failed: %', sqlerrm;
    END;
END;
$$;