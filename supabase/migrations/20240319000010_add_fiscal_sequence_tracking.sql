-- Create fiscal_sequence_usage table to track sequence usage
CREATE TABLE fiscal_sequence_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    fiscal_sequence_id UUID NOT NULL REFERENCES fiscal_sequences(id),
    fiscal_number VARCHAR(13) NOT NULL,
    document_type fiscal_document_type NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    voided BOOLEAN DEFAULT false,
    voided_at TIMESTAMP WITH TIME ZONE,
    voided_by UUID REFERENCES auth.users(id),
    void_reason TEXT,
    
    CONSTRAINT fiscal_sequence_usage_fiscal_number_unique UNIQUE (fiscal_number),
    CONSTRAINT fiscal_sequence_usage_invoice_unique UNIQUE (invoice_id)
);

-- Create indexes for better performance
CREATE INDEX idx_fiscal_sequence_usage_invoice ON fiscal_sequence_usage(invoice_id);
CREATE INDEX idx_fiscal_sequence_usage_sequence ON fiscal_sequence_usage(fiscal_sequence_id);
CREATE INDEX idx_fiscal_sequence_usage_number ON fiscal_sequence_usage(fiscal_number);
CREATE INDEX idx_fiscal_sequence_usage_date ON fiscal_sequence_usage(used_at);
CREATE INDEX idx_fiscal_sequence_usage_voided ON fiscal_sequence_usage(voided);

-- Modify the get_next_fiscal_number function to record usage
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
    
    -- Validate number hasn't exceeded limit
    IF v_next_number > 9999999999 THEN
        RAISE EXCEPTION 'Sequence limit reached for document type %', p_document_type;
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

-- Update the generate_fiscal_number trigger function
CREATE OR REPLACE FUNCTION generate_fiscal_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate fiscal number for new invoices without one
    IF NEW.fiscal_number IS NULL AND NEW.fiscal_document_type IS NOT NULL THEN
        NEW.fiscal_number := get_next_fiscal_number(NEW.fiscal_document_type, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to void a fiscal sequence
CREATE OR REPLACE FUNCTION void_fiscal_sequence(
    p_invoice_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the fiscal sequence usage record
    UPDATE fiscal_sequence_usage
    SET voided = true,
        voided_at = CURRENT_TIMESTAMP,
        voided_by = auth.uid(),
        void_reason = p_reason
    WHERE invoice_id = p_invoice_id
      AND NOT voided;
      
    -- Return true if a record was updated
    RETURN FOUND;
END;
$$;

-- Enable RLS
ALTER TABLE fiscal_sequence_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
    ON fiscal_sequence_usage FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON fiscal_sequence_usage FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
    ON fiscal_sequence_usage FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE fiscal_sequence_usage IS 'Tracks the usage of fiscal sequence numbers and their association with invoices';
COMMENT ON COLUMN fiscal_sequence_usage.invoice_id IS 'Reference to the invoice that used this sequence';
COMMENT ON COLUMN fiscal_sequence_usage.fiscal_sequence_id IS 'Reference to the fiscal sequence that generated this number';
COMMENT ON COLUMN fiscal_sequence_usage.fiscal_number IS 'The actual fiscal number assigned';
COMMENT ON COLUMN fiscal_sequence_usage.document_type IS 'Type of fiscal document';
COMMENT ON COLUMN fiscal_sequence_usage.used_at IS 'When the sequence was used';
COMMENT ON COLUMN fiscal_sequence_usage.voided IS 'Whether this sequence has been voided';
COMMENT ON COLUMN fiscal_sequence_usage.voided_at IS 'When the sequence was voided';
COMMENT ON COLUMN fiscal_sequence_usage.voided_by IS 'Who voided the sequence';
COMMENT ON COLUMN fiscal_sequence_usage.void_reason IS 'Reason for voiding the sequence';