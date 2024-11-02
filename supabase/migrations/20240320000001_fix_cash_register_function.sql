-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_cash_register(uuid);

-- Recreate the function with the correct parameter
CREATE OR REPLACE FUNCTION get_user_cash_register(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    opening_date TIMESTAMP WITH TIME ZONE,
    initial_cash DECIMAL,
    status VARCHAR,
    total_sales DECIMAL,
    total_expenses DECIMAL,
    total_withdrawals DECIMAL,
    total_deposits DECIMAL,
    expected_cash DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH transaction_totals AS (
        SELECT
            cr.id as register_id,
            COALESCE(SUM(CASE WHEN crt.transaction_type = 'SALE' AND crt.payment_method = 'CASH' THEN crt.amount ELSE 0 END), 0) as sales,
            COALESCE(SUM(CASE WHEN crt.transaction_type = 'EXPENSE' THEN crt.amount ELSE 0 END), 0) as expenses,
            COALESCE(SUM(CASE WHEN crt.transaction_type = 'WITHDRAWAL' THEN crt.amount ELSE 0 END), 0) as withdrawals,
            COALESCE(SUM(CASE WHEN crt.transaction_type = 'DEPOSIT' THEN crt.amount ELSE 0 END), 0) as deposits
        FROM cash_registers cr
        LEFT JOIN cash_register_transactions crt ON cr.id = crt.cash_register_id
        WHERE cr.user_id = p_user_id AND cr.status = 'OPEN'
        GROUP BY cr.id
    )
    SELECT
        cr.id,
        cr.opening_date,
        cr.initial_cash,
        cr.status,
        tt.sales,
        tt.expenses,
        tt.withdrawals,
        tt.deposits,
        (cr.initial_cash + tt.sales + tt.deposits - tt.expenses - tt.withdrawals) as expected_cash
    FROM cash_registers cr
    LEFT JOIN transaction_totals tt ON cr.id = tt.register_id
    WHERE cr.user_id = p_user_id AND cr.status = 'OPEN'
    LIMIT 1;
END;
$$;