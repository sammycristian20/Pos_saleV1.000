-- Insert sample product types
INSERT INTO product_types (id, name, description) VALUES
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Electronics', 'Electronic devices and accessories'),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Home Appliances', 'Appliances for home use'),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Office Supplies', 'Supplies and equipment for office use'),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'Gaming', 'Gaming consoles and accessories');

-- Insert sample categories
INSERT INTO categories (id, name, description, slug, display_order) VALUES
    ('a47ac10b-58cc-4372-a567-0e02b2c3d479', 'Smartphones', 'Mobile phones and accessories', 'smartphones', 1),
    ('a47ac10b-58cc-4372-a567-0e02b2c3d480', 'Laptops', 'Portable computers', 'laptops', 2),
    ('a47ac10b-58cc-4372-a567-0e02b2c3d481', 'Tablets', 'Tablet computers', 'tablets', 3),
    ('a47ac10b-58cc-4372-a567-0e02b2c3d482', 'Accessories', 'Device accessories', 'accessories', 4);

-- Insert sample products
INSERT INTO products (
    id, name, description, barcode, sku, price, cost, 
    stock, min_stock, type_id, category_id, tax_rate, 
    unit_measure, brand
) VALUES
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d479',
        'iPhone 13 Pro',
        '6.1-inch Super Retina XDR display with ProMotion',
        'IP13PRO256',
        'APL-IP13P-256',
        999.99,
        750.00,
        50,
        10,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a47ac10b-58cc-4372-a567-0e02b2c3d479',
        0.18,
        'unit',
        'Apple'
    ),
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d480',
        'MacBook Pro 14"',
        '14-inch Liquid Retina XDR display, M1 Pro chip',
        'MBP14M1P512',
        'APL-MBP14-512',
        1999.99,
        1500.00,
        25,
        5,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a47ac10b-58cc-4372-a567-0e02b2c3d480',
        0.18,
        'unit',
        'Apple'
    ),
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d481',
        'iPad Air',
        '10.9-inch Liquid Retina display, M1 chip',
        'IPADAIR5256',
        'APL-IPA5-256',
        599.99,
        450.00,
        75,
        15,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a47ac10b-58cc-4372-a567-0e02b2c3d481',
        0.18,
        'unit',
        'Apple'
    ),
    (
        'b47ac10b-58cc-4372-a567-0e02b2c3d482',
        'AirPods Pro',
        'Active Noise Cancellation, Spatial Audio',
        'AIRPODSPRO2',
        'APL-APP-2',
        249.99,
        175.00,
        100,
        20,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a47ac10b-58cc-4372-a567-0e02b2c3d482',
        0.18,
        'unit',
        'Apple'
    );

-- Insert sample product photos
INSERT INTO product_photos (
    id, product_id, photo_url, is_primary, display_order
) VALUES
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d479',
        'b47ac10b-58cc-4372-a567-0e02b2c3d479',
        'https://images.unsplash.com/photo-1632661674596-618b807f2020',
        true,
        1
    ),
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d480',
        'b47ac10b-58cc-4372-a567-0e02b2c3d480',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca4',
        true,
        1
    ),
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d481',
        'b47ac10b-58cc-4372-a567-0e02b2c3d481',
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',
        true,
        1
    ),
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d482',
        'b47ac10b-58cc-4372-a567-0e02b2c3d482',
        'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434',
        true,
        1
    );

-- Insert additional product photos (secondary images)
INSERT INTO product_photos (
    id, product_id, photo_url, is_primary, display_order
) VALUES
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d483',
        'b47ac10b-58cc-4372-a567-0e02b2c3d479',
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd',
        false,
        2
    ),
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d484',
        'b47ac10b-58cc-4372-a567-0e02b2c3d480',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9',
        false,
        2
    ),
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d485',
        'b47ac10b-58cc-4372-a567-0e02b2c3d481',
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',
        false,
        2
    ),
    (
        'c47ac10b-58cc-4372-a567-0e02b2c3d486',
        'b47ac10b-58cc-4372-a567-0e02b2c3d482',
        'https://images.unsplash.com/photo-1588156979435-379b927e5b47',
        false,
        2
    );

-- Add some inventory entries for these products
INSERT INTO inventory_entries (
    id, product_id, entry_type, quantity, unit_cost, 
    total_cost, reference_number, notes
) VALUES
    (
        'd47ac10b-58cc-4372-a567-0e02b2c3d479',
        'b47ac10b-58cc-4372-a567-0e02b2c3d479',
        'PURCHASE',
        50,
        750.00,
        37500.00,
        'PO-2024-001',
        'Initial stock purchase'
    ),
    (
        'd47ac10b-58cc-4372-a567-0e02b2c3d480',
        'b47ac10b-58cc-4372-a567-0e02b2c3d480',
        'PURCHASE',
        25,
        1500.00,
        37500.00,
        'PO-2024-002',
        'Initial stock purchase'
    ),
    (
        'd47ac10b-58cc-4372-a567-0e02b2c3d481',
        'b47ac10b-58cc-4372-a567-0e02b2c3d481',
        'PURCHASE',
        75,
        450.00,
        33750.00,
        'PO-2024-003',
        'Initial stock purchase'
    ),
    (
        'd47ac10b-58cc-4372-a567-0e02b2c3d482',
        'b47ac10b-58cc-4372-a567-0e02b2c3d482',
        'PURCHASE',
        100,
        175.00,
        17500.00,
        'PO-2024-004',
        'Initial stock purchase'
    );