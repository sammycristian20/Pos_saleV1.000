-- Add range fields to fiscal_sequences table
ALTER TABLE fiscal_sequences 
ADD COLUMN range_from BIGINT NOT NULL DEFAULT 0,
ADD COLUMN range_to BIGINT NOT NULL DEFAULT 9999999999,
ADD COLUMN range_alert_threshold INTEGER DEFAULT 100;

-- Update constraints
ALTER TABLE fiscal_sequences 
DROP CONSTRAINT IF EXISTS fiscal_sequences_last_number_check;

ALTER TABLE fiscal_sequences 
ADD CONSTRAINT fiscal_sequences_range_check 
CHECK (
  range_from >= 0 AND 
  range_to <= 9999999999 AND 
  range_from < range_to AND
  last_number >= range_from AND 
  last_number <= range_to
);

-- Function to check sequence availability
CREATE OR REPLACE FUNCTION check_sequence_availability(
  p_document_type fiscal_document_type
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sequence RECORD;
  v_remaining BIGINT;
BEGIN
  SELECT * INTO v_sequence
  FROM fiscal_sequences
  WHERE document_type = p_document_type
    AND active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'available', false,
      'message', 'No hay secuencia activa para este tipo de comprobante'
    );
  END IF;

  v_remaining := v_sequence.range_to - v_sequence.last_number;

  IF v_remaining <= 0 THEN
    RETURN json_build_object(
      'available', false,
      'message', 'Se ha agotado el rango de secuencias disponibles'
    );
  END IF;

  IF v_remaining <= v_sequence.range_alert_threshold THEN
    RETURN json_build_object(
      'available', true,
      'warning', format('Quedan solo %s secuencias disponibles', v_remaining)
    );
  END IF;

  RETURN json_build_object(
    'available', true,
    'remaining', v_remaining
  );
END;
$$;

-- Update get_next_fiscal_number function to check range
CREATE OR REPLACE FUNCTION get_next_fiscal_number(
  p_document_type fiscal_document_type,
  p_invoice_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sequence RECORD;
  v_next_number BIGINT;
  v_fiscal_number TEXT;
BEGIN
  -- Get the active sequence for the document type
  SELECT * INTO v_sequence
  FROM fiscal_sequences
  WHERE document_type = p_document_type
    AND active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active sequence found for document type %', p_document_type;
  END IF;
  
  -- Calculate next number
  v_next_number := v_sequence.last_number + 1;
  
  -- Validate number is within range
  IF v_next_number > v_sequence.range_to THEN
    RAISE EXCEPTION 'Se ha agotado el rango de secuencias disponibles para el tipo de comprobante %', p_document_type;
  END IF;
  
  -- Format the fiscal number
  v_fiscal_number := v_sequence.current_prefix || LPAD(v_next_number::TEXT, 10, '0');
  
  -- Update the sequence
  UPDATE fiscal_sequences
  SET last_number = v_next_number,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = v_sequence.id;
  
  -- Record the sequence usage
  INSERT INTO fiscal_sequence_usage (
    invoice_id,
    fiscal_sequence_id,
    fiscal_number,
    document_type,
    created_by
  ) VALUES (
    p_invoice_id,
    v_sequence.id,
    v_fiscal_number,
    p_document_type,
    auth.uid()
  );
  
  RETURN v_fiscal_number;
END;
$$;