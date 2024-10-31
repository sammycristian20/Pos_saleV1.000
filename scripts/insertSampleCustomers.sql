-- Insert sample customers
INSERT INTO customers (
    id, name, client_type, document, document_type, phone, email, address, active
) VALUES
    -- Personal Customers
    (
        'c1000000-0000-0000-0000-000000000001',
        'Juan Pérez Martínez',
        'PERSONAL',
        '001-0234567-8',
        'CEDULA',
        '809-555-0001',
        'juan.perez@email.com',
        'Calle Principal #123, Piantini, Santo Domingo',
        true
    ),
    (
        'c1000000-0000-0000-0000-000000000002',
        'María Rodríguez Santos',
        'PERSONAL',
        '002-0345678-9',
        'CEDULA',
        '809-555-0002',
        'maria.rodriguez@email.com',
        'Av. Abraham Lincoln #456, Naco, Santo Domingo',
        true
    ),
    (
        'c1000000-0000-0000-0000-000000000003',
        'Carlos González Mejía',
        'PERSONAL',
        '003-0456789-0',
        'CEDULA',
        '809-555-0003',
        'carlos.gonzalez@email.com',
        'Calle El Conde #789, Zona Colonial, Santo Domingo',
        true
    ),
    (
        'c1000000-0000-0000-0000-000000000004',
        'Ana Luisa Fernández',
        'PERSONAL',
        '004-0567890-1',
        'CEDULA',
        '809-555-0004',
        'ana.fernandez@email.com',
        'Av. 27 de Febrero #321, Bella Vista, Santo Domingo',
        true
    ),
    (
        'c1000000-0000-0000-0000-000000000005',
        'John Smith',
        'PERSONAL',
        'PA123456',
        'PASSPORT',
        '809-555-0005',
        'john.smith@email.com',
        'Calle Las Palmas #234, Serrallés, Santo Domingo',
        true
    ),
    -- Business Customers
    (
        'c1000000-0000-0000-0000-000000000006',
        'Tecnología Avanzada SRL',
        'BUSINESS',
        '123456789',
        'RNC',
        '809-555-0006',
        'info@tecnologiaavanzada.com',
        'Av. Winston Churchill #567, Torre Empresarial, Santo Domingo',
        true
    ),
    (
        'c1000000-0000-0000-0000-000000000007',
        'Comercial del Este SRL',
        'BUSINESS',
        '987654321',
        'RNC',
        '809-555-0007',
        'ventas@comercialeste.com',
        'Av. San Vicente de Paul #890, Los Mina, Santo Domingo Este',
        true
    ),
    (
        'c1000000-0000-0000-0000-000000000008',
        'Distribuidora del Norte SRL',
        'BUSINESS',
        '456789123',
        'RNC',
        '809-555-0008',
        'info@distnorte.com',
        'Av. Estrella Sadhalá #432, Santiago',
        true
    ),
    (
        'c1000000-0000-0000-0000-000000000009',
        'Servicios Profesionales SRL',
        'BUSINESS',
        '789123456',
        'RNC',
        '809-555-0009',
        'contacto@serviciospro.com',
        'Calle Max Henríquez Ureña #678, Piantini, Santo Domingo',
        true
    ),
    (
        'c1000000-0000-0000-0000-000000000010',
        'Importadora del Caribe SRL',
        'BUSINESS',
        '321654987',
        'RNC',
        '809-555-0010',
        'ventas@importcaribe.com',
        'Av. España #901, Villa Duarte, Santo Domingo Este',
        true
    );