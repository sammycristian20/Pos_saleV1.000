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

async function executeSellersTable() {
  try {
    const sqlPath = resolve(__dirname, '../supabase/migrations/20240323000002_create_sellers_table.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        console.error('Error executing SQL statement:', error);
        console.error('Statement:', statement);
      } else {
        console.log('Successfully executed SQL statement');
      }
    }

    console.log('Sellers table created successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

executeSellersTable()
  .then(() => console.log('Script execution completed'))
  .catch(error => console.error('Script execution failed:', error))
  .finally(() => process.exit());