create or replace function cancel_invoice(invoice_id uuid)
returns json
language plpgsql
security definer
as $$
declare
    inv record;
    item record;
begin
    -- Start transaction
    begin
        -- Get invoice details
        select * into inv
        from invoices
        where id = invoice_id
        for update;

        if not found then
            raise exception 'Invoice not found';
        end if;

        if inv.status != 'PAID' then
            raise exception 'Only paid invoices can be cancelled';
        end if;

        -- Update invoice status
        update invoices
        set status = 'CANCELLED',
            updated_at = current_timestamp
        where id = invoice_id;

        -- Update payment status if exists
        if inv.payment_id is not null then
            update payments
            set status = 'CANCELLED',
                updated_at = current_timestamp
            where id = inv.payment_id;
        end if;

        -- Restore inventory for each item
        for item in
            select ii.*, p.stock
            from invoice_items ii
            join products p on p.id = ii.product_id
            where ii.invoice_id = invoice_id
        loop
            -- Update product stock
            update products
            set stock = stock + item.quantity,
                updated_at = current_timestamp
            where id = item.product_id;

            -- Create inventory entry for stock restoration
            insert into inventory_entries (
                product_id,
                entry_type,
                quantity,
                reference_number,
                notes,
                created_by
            ) values (
                item.product_id,
                'RETURN',
                item.quantity,
                invoice_id::text,
                'Stock restored from cancelled invoice',
                auth.uid()
            );
        end loop;

        return json_build_object(
            'success', true,
            'message', 'Invoice cancelled successfully'
        );

    exception when others then
        -- Rollback will happen automatically
        raise exception 'Invoice cancellation failed: %', sqlerrm;
    end;
end;
$$;