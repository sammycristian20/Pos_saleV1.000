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

const dummySellers = [
  {
    name: "Luis Ramírez",
    phone: "809-555-1001",
    address: "Calle 1ra #23, Los Prados, Santo Domingo",
    photo_url: "https://randomuser.me/api/portraits/men/1.jpg",
    hire_date: "2023-01-15",
    salary: 35000.00,
    contract_type: "FULL_TIME",
    birth_date: "1990-05-20",
    email: "luis.ramirez@company.com",
    active: true
  },
  {
    name: "Ana Martínez",
    phone: "809-555-1002",
    address: "Av. Independencia #45, Gazcue, Santo Domingo",
    photo_url: "https://randomuser.me/api/portraits/women/1.jpg",
    hire_date: "2023-02-01",
    salary: 32000.00,
    contract_type: "FULL_TIME",
    birth_date: "1992-08-15",
    email: "ana.martinez@company.com",
    active: true
  },
  {
    name: "Pedro Sánchez",
    phone: "809-555-1003",
    address: "Calle Principal #67, Bella Vista, Santo Domingo",
    photo_url: "https://randomuser.me/api/portraits/men/2.jpg",
    hire_date: "2023-03-10",
    salary: 28000.00,
    contract_type: "PART_TIME",
    birth_date: "1988-12-03",
    email: "pedro.sanchez@company.com",
    active: true
  },
  {
    name: "María Pérez",
    phone: "809-555-1004",
    address: "Av. Abraham Lincoln #89, Piantini, Santo Domingo",
    photo_url: "https://randomuser.me/api/portraits/women/2.jpg",
    hire_date: "2023-04-01",
    salary: 40000.00,
    contract_type: "FULL_TIME",
    birth_date: "1991-03-25",
    email: "maria.perez@company.com",
    active: true
  },
  {
    name: "José García",
    phone: "809-555-1005",
    address: "Calle 27 #34, Naco, Santo Domingo",
    photo_url: "https://randomuser.me/api/portraits/men/3.jpg",
    hire_date: "2023-05-15",
    salary: 25000.00,
    contract_type: "CONTRACTOR",
    birth_date: "1993-07-12",
    email: "jose.garcia@company.com",
    active: true
  }
];

async function insertDummySellers() {
  console.log('Starting to insert dummy sellers...');
  
  try {
    const { data, error } = await supabase
      .from('sellers')
      .insert(dummySellers)
      .select();

    if (error) {
      console.error('Error inserting sellers:', error);
    } else {
      console.log(`Successfully inserted ${data.length} sellers`);
    }
  } catch (error) {
    console.error('Error in insertion process:', error);
  }
}

insertDummySellers()
  .then(() => console.log('Script execution completed'))
  .catch(error => console.error('Script execution failed:', error))
  .finally(() => process.exit());