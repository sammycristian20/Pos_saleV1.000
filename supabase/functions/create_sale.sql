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
        -- First create the payment record
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

        -- Get fiscal sequence for the specified document type
        SELECT id INTO fiscal_sequence_id
        FROM fiscal_sequences
        WHERE document_type = (sale_data->>'fiscal_document_type')::fiscal_document_type
        AND active = true
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'No active sequence found for document type %', (sale_data->>'fiscal_document_type');
        END IF;

        -- Get next fiscal number
        fiscal_number := get_next_fiscal_number((sale_data->>'fiscal_document_type')::fiscal_document_type);

        -- Create the invoice with the correct fiscal document type
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

        -- Process each sale item
        FOR item IN SELECT * FROM json_array_elements((sale_data->>'items')::json)
        LOOP
            -- Check stock availability
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

            -- Update product stock
            UPDATE products
            SET stock = stock - (item->>'quantity')::integer
            WHERE id = (item->>'product_id')::uuid;
        END LOOP;

        -- Create fiscal sequence usage record
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

        -- Return the created IDs
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