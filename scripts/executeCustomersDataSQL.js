import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertCustomersData() {
  try {
    // Read the SQL file
    const sqlPath = resolve(__dirname, 'insertCustomersData.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Execute the SQL statement
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      console.error('Error inserting customer data:', error);
    } else {
      console.log('Sample customer data inserted successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

insertCustomersData()
  .then(() => console.log('Customer data insertion completed'))
  .catch(error => console.error('Error:', error))
  .finally(() => process.exit());