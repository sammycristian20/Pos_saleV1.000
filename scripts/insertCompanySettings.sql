-- Insert sample company settings
INSERT INTO company_settings (
    id,
    name,
    rnc,
    address,
    phone,
    email
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'TechStore RD',
    '123456789',
    'Av. Winston Churchill #89, Plaza Las Américas, Local 201, Santo Domingo',
    '809-555-1234',
    'info@techstore.do'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    rnc = EXCLUDED.rnc,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email;