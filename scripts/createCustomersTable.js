import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

const customers = [
  {
    name: "John Doe",
    document: "001-0000000-1",
    document_type: "CEDULA",
    phone: "809-555-0001",
    email: "john.doe@email.com"
  },
  {
    name: "Jane Smith",
    document: "002-0000000-2",
    document_type: "CEDULA",
    phone: "809-555-0002",
    email: "jane.smith@email.com"
  },
  {
    name: "Acme Corporation",
    document: "123456789",
    document_type: "RNC",
    phone: "809-555-0003",
    email: "contact@acme.com"
  },
  {
    name: "Tech Solutions Ltd",
    document: "987654321",
    document_type: "RNC",
    phone: "809-555-0004",
    email: "info@techsolutions.com"
  },
  {
    name: "Maria Rodriguez",
    document: "003-0000000-3",
    document_type: "CEDULA",
    phone: "809-555-0005",
    email: "maria.rodriguez@email.com"
  }
];

async function insertCustomers() {
  for (const customer of customers) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer]);
    
    if (error) {
      console.error('Error inserting customer:', customer.name, error);
    } else {
      console.log('Customer inserted:', customer.name);
    }
  }
}

insertCustomers()
  .then(() => console.log('All customers inserted'))
  .catch(error => console.error('Error:', error))
  .finally(() => process.exit());