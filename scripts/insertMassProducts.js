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

// Categories with their IDs
const categories = [
  { id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Smartphones' },
  { id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480', name: 'Laptops' },
  { id: 'a47ac10b-58cc-4372-a567-0e02b2c3d481', name: 'Tablets' },
  { id: 'a47ac10b-58cc-4372-a567-0e02b2c3d482', name: 'Accessories' }
];

// Product name generators
const brands = [
  'Samsung', 'Apple', 'Sony', 'LG', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Microsoft'
];

const productTypes = {
  'Smartphones': [
    'Galaxy', 'iPhone', 'Xperia', 'Pixel', 'Nova', 'Redmi', 'Note', 'Pro', 'Ultra', 'Plus'
  ],
  'Laptops': [
    'ThinkPad', 'MacBook', 'Inspiron', 'Pavilion', 'ROG', 'Predator', 'Surface', 'ZenBook', 'IdeaPad', 'Latitude'
  ],
  'Tablets': [
    'iPad', 'Galaxy Tab', 'Surface Go', 'MatePad', 'MediaPad', 'ZenPad', 'Nexus', 'Shield', 'Fire', 'Yoga'
  ],
  'Accessories': [
    'Charger', 'Case', 'Screen Protector', 'Keyboard', 'Mouse', 'Headphones', 'Stand', 'Dock', 'Cable', 'Adapter'
  ]
};

const generateBarcode = (index) => {
  return `PRD${String(index).padStart(6, '0')}`;
};

const generateSKU = (category, index) => {
  return `${category.substring(0, 3).toUpperCase()}${String(index).padStart(6, '0')}`;
};

const generatePrice = (category) => {
  const ranges = {
    'Smartphones': { min: 299, max: 1299 },
    'Laptops': { min: 499, max: 2499 },
    'Tablets': { min: 199, max: 999 },
    'Accessories': { min: 9.99, max: 99.99 }
  };

  const range = ranges[category];
  return Number((Math.random() * (range.max - range.min) + range.min).toFixed(2));
};

const generateStock = () => {
  return Math.floor(Math.random() * 100) + 10;
};

const generateDescription = (name, category) => {
  const features = {
    'Smartphones': ['pantalla AMOLED', 'cámara de alta resolución', 'batería de larga duración', '5G', 'resistente al agua'],
    'Laptops': ['procesador de última generación', 'SSD rápido', 'pantalla Full HD', 'teclado retroiluminado', 'batería de larga duración'],
    'Tablets': ['pantalla táctil HD', 'lápiz digital compatible', 'diseño delgado', 'altavoces estéreo', 'modo lectura'],
    'Accessories': ['alta calidad', 'diseño ergonómico', 'compatible con múltiples dispositivos', 'garantía extendida', 'fácil de usar']
  };

  const categoryFeatures = features[category];
  const selectedFeatures = categoryFeatures
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return `${name} con ${selectedFeatures.join(', ')}.`;
};

const products = [];
let productIndex = 0;

// Generate products for each category
categories.forEach(category => {
  const categoryProducts = productTypes[category.name];
  const numProducts = Math.ceil(100 / categories.length);

  for (let i = 0; i < numProducts && products.length < 100; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const type = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
    const name = `${brand} ${type} ${Math.floor(Math.random() * 1000)}`;
    
    products.push({
      name,
      description: generateDescription(name, category.name),
      barcode: generateBarcode(productIndex),
      sku: generateSKU(category.name, productIndex),
      price: generatePrice(category.name),
      cost: 0, // You might want to generate this based on price
      stock: generateStock(),
      min_stock: 5,
      category_id: category.id,
      tax_rate: 0.18,
      brand,
      active: true
    });

    productIndex++;
  }
});

async function insertProducts() {
  const batchSize = 20;
  const batches = [];

  for (let i = 0; i < products.length; i += batchSize) {
    batches.push(products.slice(i, i + batchSize));
  }

  console.log(`Inserting ${products.length} products in ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i + 1}:`, error);
      } else {
        console.log(`Successfully inserted batch ${i + 1} of ${batches.length}`);
      }
    } catch (err) {
      console.error(`Error processing batch ${i + 1}:`, err);
    }
  }
}

insertProducts()
  .then(() => {
    console.log('Product insertion completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });