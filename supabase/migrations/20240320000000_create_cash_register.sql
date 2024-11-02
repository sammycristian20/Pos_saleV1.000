-- Create cash_registers table
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    opening_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closing_date TIMESTAMP WITH TIME ZONE,
    initial_cash DECIMAL(10,2) NOT NULL CHECK (initial_cash >= 0),
    final_cash DECIMAL(10,2) CHECK (final_cash >= 0),
    expected_cash DECIMAL(10,2),
    cash_difference DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cash_register_transactions table to track all transactions
CREATE TABLE cash_register_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('SALE', 'EXPENSE', 'WITHDRAWAL', 'DEPOSIT')),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'CREDIT')),
    reference_id UUID, -- Can reference an invoice, expense, etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_cash_registers_user ON cash_registers(user_id);
CREATE INDEX idx_cash_registers_status ON cash_registers(status);
CREATE INDEX idx_cash_registers_dates ON cash_registers(opening_date, closing_date);
CREATE INDEX idx_cash_register_transactions_register ON cash_register_transactions(cash_register_id);
CREATE INDEX idx_cash_register_transactions_type ON cash_register_transactions(transaction_type);
CREATE INDEX idx_cash_register_transactions_date ON cash_register_transactions(created_at);

-- Enable RLS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cash registers"
    ON cash_registers FOR SELECT
    USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert their own cash registers"
    ON cash_registers FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cash registers"
    ON cash_registers FOR UPDATE
    USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable read access for authenticated users"
    ON cash_register_transactions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON cash_register_transactions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Function to check if user has open cash register
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

-- Function to open cash register
CREATE OR REPLACE FUNCTION open_cash_register(
    p_initial_cash DECIMAL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_register_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Check if user already has an open register
    IF EXISTS (
        SELECT 1 FROM cash_registers
        WHERE user_id = v_user_id AND status = 'OPEN'
    ) THEN
        RAISE EXCEPTION 'User already has an open cash register';
    END IF;
    
    -- Create new cash register
    INSERT INTO cash_registers (
        user_id,
        initial_cash,
        notes
    ) VALUES (
        v_user_id,
        p_initial_cash,
        p_notes
    ) RETURNING id INTO v_register_id;
    
    RETURN v_register_id;
END;
$$;

-- Function to close cash register
CREATE OR REPLACE FUNCTION close_cash_register(
    p_register_id UUID,
    p_final_cash DECIMAL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_register RECORD;
    v_expected_cash DECIMAL;
    v_difference DECIMAL;
BEGIN
    -- Get register and calculate expected cash
    SELECT * INTO v_register
    FROM get_user_cash_register(auth.uid())
    WHERE id = p_register_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cash register not found or not owned by user';
    END IF;
    
    IF v_register.status = 'CLOSED' THEN
        RAISE EXCEPTION 'Cash register is already closed';
    END IF;
    
    -- Update register
    UPDATE cash_registers
    SET status = 'CLOSED',
        closing_date = CURRENT_TIMESTAMP,
        final_cash = p_final_cash,
        expected_cash = v_register.expected_cash,
        cash_difference = p_final_cash - v_register.expected_cash,
        notes = CASE 
            WHEN notes IS NULL THEN p_notes
            ELSE notes || E'\n' || p_notes
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_register_id;
    
    RETURN json_build_object(
        'register_id', p_register_id,
        'final_cash', p_final_cash,
        'expected_cash', v_register.expected_cash,
        'difference', p_final_cash - v_register.expected_cash
    );
END;
$$;

-- Function to add transaction
CREATE OR REPLACE FUNCTION add_register_transaction(
    p_register_id UUID,
    p_type VARCHAR,
    p_amount DECIMAL,
    p_payment_method VARCHAR DEFAULT 'CASH',
    p_reference_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- Verify register is open
    IF NOT EXISTS (
        SELECT 1 FROM cash_registers
        WHERE id = p_register_id
        AND status = 'OPEN'
        AND (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
    ) THEN
        RAISE EXCEPTION 'Cash register not found or not open';
    END IF;
    
    -- Insert transaction
    INSERT INTO cash_register_transactions (
        cash_register_id,
        transaction_type,
        amount,
        payment_method,
        reference_id,
        notes,
        created_by
    ) VALUES (
        p_register_id,
        p_type,
        p_amount,
        p_payment_method,
        p_reference_id,
        p_notes,
        auth.uid()
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;

-- Grant permissions
GRANT ALL ON cash_registers TO authenticated;
GRANT ALL ON cash_register_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_cash_register TO authenticated;
GRANT EXECUTE ON FUNCTION open_cash_register TO authenticated;
GRANT EXECUTE ON FUNCTION close_cash_register TO authenticated;
GRANT EXECUTE ON FUNCTION add_register_transaction TO authenticated;