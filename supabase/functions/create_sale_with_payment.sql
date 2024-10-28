create or replace function create_sale_with_payment(
    payment_data json,
    sale_data json
)
returns json
language plpgsql
security definer
as $$
declare
    new_payment_id uuid;
    new_invoice_id uuid;
    item json;
    current_stock integer;
begin
    -- Start transaction
    begin
        -- First, create the payment record
        insert into payments (
            amount,
            payment_method,
            status,
            amount_tendered,
            change_amount,
            created_by,
            metadata
        )
        values (
            (payment_data->>'amount')::decimal,
            (payment_data->>'payment_method')::payment_method,
            'COMPLETED',
            (payment_data->>'amount_tendered')::decimal,
            (payment_data->>'change_amount')::decimal,
            auth.uid(),
            payment_data->'metadata'
        )
        returning id into new_payment_id;

        -- Then, create the invoice
        insert into invoices (
            customer_id,
            payment_id,
            subtotal,
            tax_amount,
            total_amount,
            status,
            created_by
        )
        values (
            (sale_data->>'customer_id')::uuid,
            new_payment_id,
            (sale_data->>'subtotal')::decimal,
            (sale_data->>'tax_amount')::decimal,
            (sale_data->>'total_amount')::decimal,
            'PAID',
            auth.uid()
        )
        returning id into new_invoice_id;

        -- Process each sale item
        for item in select * from json_array_elements((sale_data->>'items')::json)
        loop
            -- Check stock availability
            select stock into current_stock
            from products
            where id = (item->>'product_id')::uuid
            for update;

            if current_stock < (item->>'quantity')::integer then
                raise exception 'Insufficient stock for product %', (item->>'product_id')::uuid;
            end if;

            -- Create invoice item
            insert into invoice_items (
                invoice_id,
                product_id,
                quantity,
                unit_price,
                tax_rate,
                tax_amount,
                subtotal,
                total
            )
            values (
                new_invoice_id,
                (item->>'product_id')::uuid,
                (item->>'quantity')::integer,
                (item->>'unit_price')::decimal,
                (item->>'tax_rate')::decimal,
                (item->>'tax_amount')::decimal,
                (item->>'subtotal')::decimal,
                (item->>'total')::decimal
            );

            -- Update product stock
            update products
            set stock = stock - (item->>'quantity')::integer
            where id = (item->>'product_id')::uuid;
        end loop;

        -- Return the created payment and invoice IDs
        return json_build_object(
            'payment_id', new_payment_id,
            'invoice_id', new_invoice_id,
            'status', 'success'
        );

    exception when others then
        -- Rollback will happen automatically
        raise exception 'Sale creation failed: %', sqlerrm;
    end;
end;
$$;