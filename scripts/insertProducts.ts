import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const products = [
  { name: "Laptop Pro X", price: 1299.99, barcode: "LP001", stock: 50 },
  { name: "Smartphone Galaxy", price: 799.99, barcode: "SG001", stock: 100 },
  { name: "Wireless Earbuds", price: 129.99, barcode: "WE001", stock: 200 },
  { name: "4K Smart TV", price: 549.99, barcode: "TV001", stock: 30 },
  { name: "Coffee Maker Deluxe", price: 79.99, barcode: "CM001", stock: 75 },
  { name: "Fitness Tracker", price: 49.99, barcode: "FT001", stock: 150 },
  { name: "Gaming Console X", price: 399.99, barcode: "GC001", stock: 40 },
  { name: "Bluetooth Speaker", price: 59.99, barcode: "BS001", stock: 100 },
  { name: "Digital Camera Pro", price: 699.99, barcode: "DC001", stock: 25 },
  { name: "Electric Toothbrush", price: 39.99, barcode: "ET001", stock: 80 },
  { name: "Robotic Vacuum", price: 249.99, barcode: "RV001", stock: 35 },
  { name: "Portable Charger", price: 29.99, barcode: "PC001", stock: 200 },
  { name: "Wireless Mouse", price: 24.99, barcode: "WM001", stock: 150 },
  { name: "Smart Watch", price: 199.99, barcode: "SW001", stock: 60 },
  { name: "Air Purifier", price: 129.99, barcode: "AP001", stock: 40 },
  { name: "Ergonomic Chair", price: 199.99, barcode: "EC001", stock: 30 },
  { name: "External SSD 1TB", price: 149.99, barcode: "ES001", stock: 70 },
  { name: "Noise-Canceling Headphones", price: 249.99, barcode: "NH001", stock: 50 },
  { name: "Smart Thermostat", price: 179.99, barcode: "ST001", stock: 45 },
  { name: "Wireless Keyboard", price: 49.99, barcode: "WK001", stock: 100 }
];

async function insertProducts() {
  for (const product of products) {
    const { data, error } = await supabase
      .from('products')
      .insert([product]);
    
    if (error) {
      console.error('Error inserting product:', product.name, error);
    } else {
      console.log('Product inserted:', product.name);
    }
  }
}

insertProducts()
  .then(() => console.log('All products inserted'))
  .catch(error => console.error('Error:', error))
  .finally(() => process.exit());