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

const dummyCustomers = [
  // Personal customers
  {
    name: "Juan Pérez Martínez",
    client_type: "PERSONAL",
    document: "001-0234567-8",
    document_type: "CEDULA",
    phone: "809-555-0001",
    email: "juan.perez@email.com",
    address: "Calle Principal #123, Piantini, Santo Domingo",
    active: true
  },
  {
    name: "María Rodríguez Santos",
    client_type: "PERSONAL",
    document: "002-0345678-9",
    document_type: "CEDULA",
    phone: "809-555-0002",
    email: "maria.rodriguez@email.com",
    address: "Av. Abraham Lincoln #456, Naco, Santo Domingo",
    active: true
  },
  {
    name: "Carlos González Mejía",
    client_type: "PERSONAL",
    document: "003-0456789-0",
    document_type: "CEDULA",
    phone: "809-555-0003",
    email: "carlos.gonzalez@email.com",
    address: "Calle El Conde #789, Zona Colonial, Santo Domingo",
    active: true
  },
  {
    name: "Ana Luisa Fernández",
    client_type: "PERSONAL",
    document: "004-0567890-1",
    document_type: "CEDULA",
    phone: "809-555-0004",
    email: "ana.fernandez@email.com",
    address: "Av. 27 de Febrero #321, Bella Vista, Santo Domingo",
    active: true
  },
  {
    name: "John Smith",
    client_type: "PERSONAL",
    document: "PA123456",
    document_type: "PASSPORT",
    phone: "809-555-0005",
    email: "john.smith@email.com",
    address: "Calle Las Palmas #234, Serrallés, Santo Domingo",
    active: true
  },
  // Business customers
  {
    name: "Tecnología Avanzada SRL",
    client_type: "BUSINESS",
    document: "123456789",
    document_type: "RNC",
    phone: "809-555-0006",
    email: "info@tecnologiaavanzada.com",
    address: "Av. Winston Churchill #567, Torre Empresarial, Santo Domingo",
    active: true
  },
  {
    name: "Comercial del Este SRL",
    client_type: "BUSINESS",
    document: "987654321",
    document_type: "RNC",
    phone: "809-555-0007",
    email: "ventas@comercialeste.com",
    address: "Av. San Vicente de Paul #890, Los Mina, Santo Domingo Este",
    active: true
  },
  {
    name: "Distribuidora del Norte SRL",
    client_type: "BUSINESS",
    document: "456789123",
    document_type: "RNC",
    phone: "809-555-0008",
    email: "info@distnorte.com",
    address: "Av. Estrella Sadhalá #432, Santiago",
    active: true
  },
  {
    name: "Servicios Profesionales SRL",
    client_type: "BUSINESS",
    document: "789123456",
    document_type: "RNC",
    phone: "809-555-0009",
    email: "contacto@serviciospro.com",
    address: "Calle Max Henríquez Ureña #678, Piantini, Santo Domingo",
    active: true
  },
  {
    name: "Importadora del Caribe SRL",
    client_type: "BUSINESS",
    document: "321654987",
    document_type: "RNC",
    phone: "809-555-0010",
    email: "ventas@importcaribe.com",
    address: "Av. España #901, Villa Duarte, Santo Domingo Este",
    active: true
  }
];

async function insertDummyCustomers() {
  console.log('Starting to insert dummy customers...');
  
  try {
    // Insert customers in batches of 5
    const batchSize = 5;
    for (let i = 0; i < dummyCustomers.length; i += batchSize) {
      const batch = dummyCustomers.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('customers')
        .insert(batch)
        .select();

      if (error) {
        console.error('Error inserting batch:', error);
        console.error('Failed batch:', batch);
      } else {
        console.log(`Successfully inserted batch of ${data.length} customers`);
      }
    }

    console.log('Finished inserting all dummy customers');
  } catch (error) {
    console.error('Error in insertion process:', error);
  }
}

insertDummyCustomers()
  .then(() => console.log('Script execution completed'))
  .catch(error => console.error('Script execution failed:', error))
  .finally(() => process.exit());