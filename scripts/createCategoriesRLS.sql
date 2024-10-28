-- Enable RLS for categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy for select (read)
CREATE POLICY "Enable read access for all users" ON categories
    FOR SELECT USING (true);

-- Create policy for insert
CREATE POLICY "Enable insert access for all users" ON categories
    FOR INSERT WITH CHECK (true);

-- Create policy for update
CREATE POLICY "Enable update access for all users" ON categories
    FOR UPDATE USING (true);

-- Create policy for delete
CREATE POLICY "Enable delete access for all users" ON categories
    FOR DELETE USING (true);