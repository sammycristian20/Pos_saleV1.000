-- Create default client
INSERT INTO customers (
    id,
    name,
    document,
    document_type,
    client_type,
    created_at,
    updated_at,
    active
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Consumidor Final',
    '000-0000000-0',
    'CEDULA',
    'PERSONAL',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    true
) ON CONFLICT (id) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE customers IS 'Customer information. Contains a default "Consumidor Final" record for walk-in customers';