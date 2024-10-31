-- Function to get users with pagination and filtering
CREATE OR REPLACE FUNCTION get_users(
    p_search TEXT DEFAULT NULL,
    p_role TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_users AS (
        SELECT u.*
        FROM users u
        WHERE (p_search IS NULL 
            OR u.email ILIKE '%' || p_search || '%')
        AND (p_role IS NULL OR u.role = p_role)
    )
    SELECT 
        fu.id,
        fu.email,
        fu.role,
        fu.created_at,
        COUNT(*) OVER() AS total_count
    FROM filtered_users fu
    ORDER BY fu.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get inventory with pagination and filtering
CREATE OR REPLACE FUNCTION get_inventory(
    p_search TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    barcode VARCHAR,
    sku VARCHAR,
    price DECIMAL,
    cost DECIMAL,
    stock INTEGER,
    min_stock INTEGER,
    category_id UUID,
    category_name VARCHAR,
    tax_rate DECIMAL,
    brand VARCHAR,
    active BOOLEAN,
    photos JSON,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_products AS (
        SELECT 
            p.*,
            c.name as category_name,
            json_agg(json_build_object(
                'id', ph.id,
                'photo_url', ph.photo_url,
                'is_primary', ph.is_primary
            )) FILTER (WHERE ph.id IS NOT NULL) as photos
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN product_photos ph ON ph.product_id = p.id
        WHERE (p_search IS NULL 
            OR p.name ILIKE '%' || p_search || '%'
            OR p.barcode ILIKE '%' || p_search || '%'
            OR p.sku ILIKE '%' || p_search || '%')
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
        GROUP BY p.id, c.name
    )
    SELECT 
        fp.id,
        fp.name,
        fp.description,
        fp.barcode,
        fp.sku,
        fp.price,
        fp.cost,
        fp.stock,
        fp.min_stock,
        fp.category_id,
        fp.category_name,
        fp.tax_rate,
        fp.brand,
        fp.active,
        COALESCE(fp.photos, '[]'::json),
        COUNT(*) OVER() AS total_count
    FROM filtered_products fp
    ORDER BY fp.name
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get categories with pagination and filtering
CREATE OR REPLACE FUNCTION get_categories(
    p_search TEXT DEFAULT NULL,
    p_parent_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    parent_id UUID,
    image_url TEXT,
    slug VARCHAR,
    display_order INTEGER,
    active BOOLEAN,
    product_count BIGINT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_categories AS (
        SELECT 
            c.*,
            COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        WHERE (p_search IS NULL 
            OR c.name ILIKE '%' || p_search || '%'
            OR c.description ILIKE '%' || p_search || '%')
        AND (p_parent_id IS NULL OR c.parent_id = p_parent_id)
        GROUP BY c.id
    )
    SELECT 
        fc.id,
        fc.name,
        fc.description,
        fc.parent_id,
        fc.image_url,
        fc.slug,
        fc.display_order,
        fc.active,
        fc.product_count,
        COUNT(*) OVER() AS total_count
    FROM filtered_categories fc
    ORDER BY fc.display_order, fc.name
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get customers with pagination and filtering
CREATE OR REPLACE FUNCTION get_customers(
    p_search TEXT DEFAULT NULL,
    p_client_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    client_type VARCHAR,
    document VARCHAR,
    document_type VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    address TEXT,
    active BOOLEAN,
    total_purchases DECIMAL,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH customer_totals AS (
        SELECT 
            i.customer_id,
            COALESCE(SUM(i.total_amount), 0) as total_purchases
        FROM invoices i
        WHERE i.status = 'PAID'
        GROUP BY i.customer_id
    ),
    filtered_customers AS (
        SELECT 
            c.*,
            COALESCE(ct.total_purchases, 0) as total_purchases
        FROM customers c
        LEFT JOIN customer_totals ct ON ct.customer_id = c.id
        WHERE (p_search IS NULL 
            OR c.name ILIKE '%' || p_search || '%'
            OR c.document ILIKE '%' || p_search || '%'
            OR c.email ILIKE '%' || p_search || '%')
        AND (p_client_type IS NULL OR c.client_type = p_client_type)
    )
    SELECT 
        fc.id,
        fc.name,
        fc.client_type,
        fc.document,
        fc.document_type,
        fc.phone,
        fc.email,
        fc.address,
        fc.active,
        fc.total_purchases,
        COUNT(*) OVER() AS total_count
    FROM filtered_customers fc
    ORDER BY fc.name
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get discounts with pagination and filtering
CREATE OR REPLACE FUNCTION get_discounts(
    p_search TEXT DEFAULT NULL,
    p_active BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type VARCHAR,
    value DECIMAL,
    active BOOLEAN,
    min_purchase_amount DECIMAL,
    max_discount_amount DECIMAL,
    start_date DATE,
    end_date DATE,
    product_count BIGINT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH discount_usage AS (
        SELECT 
            d.id as discount_id,
            COUNT(DISTINCT pd.product_id) as product_count
        FROM discounts d
        LEFT JOIN product_discounts pd ON pd.discount_id = d.id
        GROUP BY d.id
    ),
    filtered_discounts AS (
        SELECT 
            d.*,
            COALESCE(du.product_count, 0) as product_count
        FROM discounts d
        LEFT JOIN discount_usage du ON du.discount_id = d.id
        WHERE (p_search IS NULL 
            OR d.name ILIKE '%' || p_search || '%')
        AND (p_active IS NULL OR d.active = p_active)
    )
    SELECT 
        fd.id,
        fd.name,
        fd.type,
        fd.value,
        fd.active,
        fd.min_purchase_amount,
        fd.max_discount_amount,
        fd.start_date,
        fd.end_date,
        fd.product_count,
        COUNT(*) OVER() AS total_count
    FROM filtered_discounts fd
    ORDER BY fd.name
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get available discounts for a purchase amount
CREATE OR REPLACE FUNCTION get_available_discounts(
    p_purchase_amount DECIMAL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type VARCHAR,
    value DECIMAL,
    min_purchase_amount DECIMAL,
    max_discount_amount DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.type,
        d.value,
        d.min_purchase_amount,
        d.max_discount_amount
    FROM discounts d
    WHERE d.active = true
    AND (d.min_purchase_amount IS NULL OR p_purchase_amount >= d.min_purchase_amount)
    AND (d.start_date IS NULL OR CURRENT_DATE >= d.start_date)
    AND (d.end_date IS NULL OR CURRENT_DATE <= d.end_date)
    ORDER BY 
        CASE 
            WHEN d.type = 'PERCENTAGE' THEN d.value * p_purchase_amount / 100
            ELSE d.value
        END DESC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION get_categories TO authenticated;
GRANT EXECUTE ON FUNCTION get_customers TO authenticated;
GRANT EXECUTE ON FUNCTION get_discounts TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_discounts TO authenticated;