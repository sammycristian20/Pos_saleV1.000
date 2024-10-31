CREATE OR REPLACE FUNCTION get_next_fiscal_number(p_document_type fiscal_document_type)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sequence record;
    v_next_number bigint;
    v_fiscal_number text;
BEGIN
    -- Get the active sequence for the document type with row lock
    SELECT * INTO v_sequence
    FROM fiscal_sequences
    WHERE document_type = p_document_type
      AND active = true
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active sequence found for document type %', p_document_type;
    END IF;
    
    -- Get the next sequential number
    v_next_number := v_sequence.last_number + 1;
    
    -- Validate number hasn't exceeded limit
    IF v_next_number > 9999999999 THEN
        RAISE EXCEPTION 'Sequence limit reached for document type %', p_document_type;
    END IF;
    
    -- Format the fiscal number
    v_fiscal_number := v_sequence.current_prefix || lpad(v_next_number::text, 10, '0');
    
    -- Set session variable to allow update
    PERFORM set_config('app.updating_sequence', 'true', true);
    
    -- Update the sequence
    UPDATE fiscal_sequences
    SET last_number = v_next_number,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_sequence.id;

    -- Reset session variable
    PERFORM set_config('app.updating_sequence', 'false', true);
    
    RETURN v_fiscal_number;
END;
$$;

-- Create function to check if update is allowed
CREATE OR REPLACE FUNCTION is_sequence_update_allowed()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN current_setting('app.updating_sequence', true) = 'true';
END;
$$;

-- Update trigger to use the check function
CREATE OR REPLACE FUNCTION prevent_manual_sequence_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.last_number != NEW.last_number THEN
        IF NOT is_sequence_update_allowed() THEN
            RAISE EXCEPTION 'Direct updates to last_number are not allowed. Use get_next_fiscal_number() instead.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS prevent_sequence_manual_update ON fiscal_sequences;

-- Create new trigger
CREATE TRIGGER prevent_sequence_manual_update
    BEFORE UPDATE ON fiscal_sequences
    FOR EACH ROW
    EXECUTE FUNCTION prevent_manual_sequence_update();