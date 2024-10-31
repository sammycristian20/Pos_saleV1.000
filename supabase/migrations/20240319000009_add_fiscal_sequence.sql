-- Create enum for document types
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

-- Create fiscal_sequences table
CREATE TABLE fiscal_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type fiscal_document_type NOT NULL,
    series CHAR(1) NOT NULL DEFAULT 'E',
    last_number BIGINT NOT NULL DEFAULT 0,
    current_prefix VARCHAR(3) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique combination of series and document type
    CONSTRAINT fiscal_sequences_unique UNIQUE (series, document_type),
    -- Validate last_number is non-negative and within 10-digit limit
    CONSTRAINT fiscal_sequences_last_number_check CHECK (last_number >= 0 AND last_number <= 9999999999),
    -- Validate prefix format (E + 2 digits)
    CONSTRAINT fiscal_sequences_prefix_check CHECK (current_prefix ~ '^E\d{2}$')
);

-- Create function to get next fiscal number
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
    
    -- Update the sequence
    UPDATE fiscal_sequences
    SET last_number = v_next_number,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_sequence.id;
    
    -- Format the fiscal number (E + type + 10-digit sequence)
    v_fiscal_number := v_sequence.current_prefix || LPAD(v_next_number::TEXT, 10, '0');
    
    RETURN v_fiscal_number;
END;
$$;

-- Insert initial sequences for each document type
INSERT INTO fiscal_sequences (document_type, current_prefix) VALUES
    ('CREDITO_FISCAL', 'E31'),
    ('CONSUMO', 'E32'),
    ('NOTA_DEBITO', 'E33'),
    ('NOTA_CREDITO', 'E34'),
    ('COMPRAS', 'E41'),
    ('GASTOS_MENORES', 'E43'),
    ('REGIMENES_ESPECIALES', 'E44'),
    ('GUBERNAMENTAL', 'E45');

-- Add fiscal_number column to invoices
ALTER TABLE invoices
ADD COLUMN fiscal_number VARCHAR(13) UNIQUE,
ADD COLUMN fiscal_document_type fiscal_document_type;

-- Create function to automatically generate fiscal number on invoice creation
CREATE OR REPLACE FUNCTION generate_fiscal_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate fiscal number for new invoices without one
    IF NEW.fiscal_number IS NULL AND NEW.fiscal_document_type IS NOT NULL THEN
        NEW.fiscal_number := get_next_fiscal_number(NEW.fiscal_document_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate fiscal number
CREATE TRIGGER generate_invoice_fiscal_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_fiscal_number();

-- Enable RLS
ALTER TABLE fiscal_sequences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
    ON fiscal_sequences FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON fiscal_sequences FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
    ON fiscal_sequences FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE fiscal_sequences IS 'Manages sequences for electronic fiscal receipts (e-CF)';
COMMENT ON COLUMN fiscal_sequences.document_type IS 'Type of fiscal document (31-45)';
COMMENT ON COLUMN fiscal_sequences.series IS 'Series letter (E)';
COMMENT ON COLUMN fiscal_sequences.last_number IS 'Last used number in sequence';
COMMENT ON COLUMN fiscal_sequences.current_prefix IS 'Current prefix (E + type)';
COMMENT ON COLUMN invoices.fiscal_number IS 'Electronic fiscal receipt number (e-CF)';
COMMENT ON COLUMN invoices.fiscal_document_type IS 'Type of fiscal document for this invoice';