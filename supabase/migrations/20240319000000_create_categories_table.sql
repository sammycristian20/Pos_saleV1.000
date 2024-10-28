-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    image_url TEXT,
    slug VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    
    CONSTRAINT categories_name_unique UNIQUE (name),
    CONSTRAINT categories_slug_unique UNIQUE (slug),
    CONSTRAINT categories_display_order_check CHECK (display_order >= 0),
    CONSTRAINT categories_no_self_parent CHECK (id != parent_id)
);

-- Create indexes
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(active);
CREATE INDEX idx_categories_created_at ON categories(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for authenticated users"
    ON categories
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users"
    ON categories
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users"
    ON categories
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users"
    ON categories
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create recursive view for category hierarchy
CREATE OR REPLACE VIEW category_hierarchy AS
WITH RECURSIVE category_tree AS (
    -- Base case: categories without parents
    SELECT 
        id,
        name,
        parent_id,
        1 as level,
        ARRAY[name] as path,
        ARRAY[id] as path_ids
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: categories with parents
    SELECT
        c.id,
        c.name,
        c.parent_id,
        ct.level + 1,
        ct.path || c.name,
        ct.path_ids || c.id
    FROM categories c
    INNER JOIN category_tree ct ON ct.id = c.parent_id
)
SELECT 
    id,
    name,
    parent_id,
    level,
    path,
    path_ids,
    array_to_string(path, ' > ') as full_path
FROM category_tree;

-- Comments for documentation
COMMENT ON TABLE categories IS 'Stores product categories with hierarchical structure support';
COMMENT ON COLUMN categories.id IS 'Unique identifier for the category';
COMMENT ON COLUMN categories.name IS 'Category name';
COMMENT ON COLUMN categories.description IS 'Optional description of the category';
COMMENT ON COLUMN categories.parent_id IS 'Reference to parent category for hierarchical structure';
COMMENT ON COLUMN categories.image_url IS 'URL to category image';
COMMENT ON COLUMN categories.slug IS 'URL-friendly version of the category name';
COMMENT ON COLUMN categories.display_order IS 'Order for displaying categories';
COMMENT ON COLUMN categories.active IS 'Whether the category is active';
COMMENT ON VIEW category_hierarchy IS 'Recursive view showing complete category hierarchy with paths';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT ON category_hierarchy TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;