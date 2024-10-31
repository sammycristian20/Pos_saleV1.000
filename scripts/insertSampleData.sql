-- Insert sample categories
INSERT INTO categories (id, name, description, slug, display_order) VALUES
    ('a47ac10b-58cc-4372-a567-0e02b2c3d479', 'Smartphones', 'Teléfonos móviles y accesorios', 'smartphones', 1),
    ('a47ac10b-58cc-4372-a567-0e02b2c3d480', 'Laptops', 'Computadoras portátiles', 'laptops', 2),
    ('a47ac10b-58cc-4372-a567-0e02b2c3d481', 'Tablets', 'Tabletas y accesorios', 'tablets', 3),
    ('a47ac10b-58cc-4372-a567-0e02b2c3d482', 'Accesorios', 'Accesorios para dispositivos', 'accesorios', 4),
    ('a47ac10b-58cc-4372-a567-0e02b2c3d483', 'Audio', 'Equipos de audio y sonido', 'audio', 5),
    ('a47ac10b-58cc-4372-a567-0e02b2c3d484', 'Gaming', 'Consolas y videojuegos', 'gaming', 6);

-- Insert sample products
INSERT INTO products (
    id, name, description, barcode, sku, price, cost, 
    stock, min_stock, category_id, tax_rate, brand
) VALUES
    -- Smartphones
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d479',
        'iPhone 15 Pro',
        'iPhone 15 Pro 256GB Titanio Natural',
        'IP15PRO256',
        'APL-IP15P-256',
        1299.99,
        950.00,
        25,
        5,
        'a47ac10b-58cc-4372-a567-0e02b2c3d479',
        0.18,
        'Apple'
    ),
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d480',
        'Samsung Galaxy S24 Ultra',
        'Samsung Galaxy S24 Ultra 512GB Negro',
        'SGS24U512',
        'SAM-S24U-512',
        1399.99,
        1050.00,
        20,
        5,
        'a47ac10b-58cc-4372-a567-0e02b2c3d479',
        0.18,
        'Samsung'
    ),
    -- Laptops
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d481',
        'MacBook Pro 16"',
        'MacBook Pro 16" M3 Pro 1TB',
        'MBP16M3P1T',
        'APL-MBP16-1T',
        2499.99,
        1900.00,
        15,
        3,
        'a47ac10b-58cc-4372-a567-0e02b2c3d480',
        0.18,
        'Apple'
    ),
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d482',
        'Dell XPS 15',
        'Dell XPS 15 i9 32GB RAM 1TB SSD',
        'DXPS15I932',
        'DEL-XPS15-32',
        2299.99,
        1750.00,
        12,
        3,
        'a47ac10b-58cc-4372-a567-0e02b2c3d480',
        0.18,
        'Dell'
    ),
    -- Tablets
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d483',
        'iPad Pro 12.9"',
        'iPad Pro 12.9" M2 256GB WiFi+Cellular',
        'IPP129M2256',
        'APL-IPP129-256',
        1299.99,
        950.00,
        30,
        8,
        'a47ac10b-58cc-4372-a567-0e02b2c3d481',
        0.18,
        'Apple'
    ),
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d484',
        'Samsung Galaxy Tab S9 Ultra',
        'Samsung Galaxy Tab S9 Ultra 512GB',
        'SGTS9U512',
        'SAM-TS9U-512',
        1199.99,
        900.00,
        25,
        5,
        'a47ac10b-58cc-4372-a567-0e02b2c3d481',
        0.18,
        'Samsung'
    ),
    -- Accesorios
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d485',
        'AirPods Pro 2',
        'AirPods Pro 2da Generación con USB-C',
        'APP2USBC',
        'APL-APP2-USBC',
        249.99,
        175.00,
        50,
        10,
        'a47ac10b-58cc-4372-a567-0e02b2c3d482',
        0.18,
        'Apple'
    ),
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d486',
        'Magic Keyboard',
        'Magic Keyboard para iPad Pro 12.9"',
        'MKIPADPRO',
        'APL-MK-IPP',
        349.99,
        250.00,
        20,
        5,
        'a47ac10b-58cc-4372-a567-0e02b2c3d482',
        0.18,
        'Apple'
    ),
    -- Audio
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d487',
        'Sony WH-1000XM5',
        'Audífonos Sony WH-1000XM5 Noise Cancelling',
        'SONWH1000XM5',
        'SON-WH1000XM5',
        399.99,
        300.00,
        30,
        8,
        'a47ac10b-58cc-4372-a567-0e02b2c3d483',
        0.18,
        'Sony'
    ),
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d488',
        'HomePod mini',
        'HomePod mini Altavoz Inteligente',
        'HPMINI',
        'APL-HPM',
        99.99,
        70.00,
        40,
        10,
        'a47ac10b-58cc-4372-a567-0e02b2c3d483',
        0.18,
        'Apple'
    ),
    -- Gaming
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d489',
        'PS5 Digital Edition',
        'PlayStation 5 Digital Edition',
        'PS5DE',
        'SNY-PS5-DE',
        399.99,
        300.00,
        15,
        5,
        'a47ac10b-58cc-4372-a567-0e02b2c3d484',
        0.18,
        'Sony'
    ),
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d490',
        'Nintendo Switch OLED',
        'Nintendo Switch OLED Blanco',
        'NSWOLED',
        'NIN-NSW-OLED',
        349.99,
        250.00,
        20,
        5,
        'a47ac10b-58cc-4372-a567-0e02b2c3d484',
        0.18,
        'Nintendo'
    );

-- Insert product photos
INSERT INTO product_photos (
    id, product_id, photo_url, is_primary
) VALUES
    -- iPhone 15 Pro
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d479',
        'b47ac10b-58cc-4372-a567-0e02b2c3d479',
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569',
        true
    ),
    -- Samsung S24 Ultra
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d480',
        'b47ac10b-58cc-4372-a567-0e02b2c3d480',
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c',
        true
    ),
    -- MacBook Pro
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d481',
        'b47ac10b-58cc-4372-a567-0e02b2c3d481',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca4',
        true
    ),
    -- Dell XPS
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d482',
        'b47ac10b-58cc-4372-a567-0e02b2c3d482',
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45',
        true
    ),
    -- iPad Pro
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d483',
        'b47ac10b-58cc-4372-a567-0e02b2c3d483',
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',
        true
    ),
    -- Galaxy Tab
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d484',
        'b47ac10b-58cc-4372-a567-0e02b2c3d484',
        'https://images.unsplash.com/photo-1632634571086-44a93c2e9043',
        true
    ),
    -- AirPods Pro
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d485',
        'b47ac10b-58cc-4372-a567-0e02b2c3d485',
        'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434',
        true
    ),
    -- Magic Keyboard
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d486',
        'b47ac10b-58cc-4372-a567-0e02b2c3d486',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
        true
    ),
    -- Sony WH-1000XM5
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d487',
        'b47ac10b-58cc-4372-a567-0e02b2c3d487',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
        true
    ),
    -- HomePod mini
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d488',
        'b47ac10b-58cc-4372-a567-0e02b2c3d488',
        'https://images.unsplash.com/photo-1589492477829-5e65395b66cc',
        true
    ),
    -- PS5
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d489',
        'b47ac10b-58cc-4372-a567-0e02b2c3d489',
        'https://images.unsplash.com/photo-1607853202273-797f1c22a38e',
        true
    ),
    -- Nintendo Switch
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d490',
        'b47ac10b-58cc-4372-a567-0e02b2c3d490',
        'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e',
        true
    );

-- Insert sample discounts
INSERT INTO discounts (
    id, name, type, value, active, min_purchase_amount, max_discount_amount
) VALUES
    (
        'd47ac10b-58cc-4372-a567-0e02b2c3d479',
        'Descuento Black Friday',
        'PERCENTAGE',
        20,
        true,
        500.00,
        200.00
    ),
    (
        'd47ac10b-58cc-4372-a567-0e02b2c3d480',
        'Descuento Navideño',
        'PERCENTAGE',
        15,
        true,
        300.00,
        150.00
    ),
    (
        'd47ac10b-58cc-4372-a567-0e02b2c3d481',
        'Descuento Estudiantes',
        'PERCENTAGE',
        10,
        true,
        null,
        100.00
    ),
    (
        'd47ac10b-58cc-4372-a567-0e02b2c3d482',
        'Cupón $50',
        'FIXED',
        50.00,
        true,
        200.00,
        null
    );

-- Insert inventory entries for initial stock
INSERT INTO inventory_entries (
    id, product_id, entry_type, quantity, unit_cost, 
    total_cost, reference_number, notes
) VALUES
    (
        'e47ac10b-58cc-4372-a567-0e02b2c3d479',
        'b47ac10b-58cc-4372-a567-0e02b2c3d479',
        'PURCHASE',
        25,
        950.00,
        23750.00,
        'PO-2024-001',
        'Compra inicial iPhone 15 Pro'
    ),
    (
        'e47ac10b-58cc-4372-a567-0e02b2c3d480',
        'b47ac10b-58cc-4372-a567-0e02b2c3d480',
        'PURCHASE',
        20,
        1050.00,
        21000.00,
        'PO-2024-002',
        'Compra inicial Samsung S24 Ultra'
    ),
    (
        'e47ac10b-58cc-4372-a567-0e02b2c3d481',
        'b47ac10b-58cc-4372-a567-0e02b2c3d481',
        'PURCHASE',
        15,
        1900.00,
        28500.00,
        'PO-2024-003',
        'Compra inicial MacBook Pro'
    ),
    (
        'e47ac10b-58cc-4372-a567-0e02b2c3d482',
        'b47ac10b-58cc-4372-a567-0e02b2c3d482',
        'PURCHASE',
        12,
        1750.00,
        21000.00,
        'PO-2024-004',
        'Compra inicial Dell XPS'
    );