import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ProductCard from './ProductCard';
import { Product } from './types';
import { usePOS } from '../../contexts/POSContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ProductGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = usePOS();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          photos:product_photos (
            photo_url,
            is_primary
          ),
          discounts:product_discounts (
            id,
            discount:discounts (
              id,
              name,
              type,
              value,
              active,
              start_date,
              end_date
            )
          ),
          categories (
            name
          )
        `)
        .order('name');

      if (error) throw error;

      // Filter out inactive discounts and check dates
      const productsWithActiveDiscounts = data?.map(product => ({
        ...product,
        discounts: product.discounts?.filter(d => {
          const discount = d.discount;
          if (!discount.active) return false;
          
          if (discount.start_date && discount.end_date) {
            const now = new Date();
            const start = new Date(discount.start_date);
            const end = new Date(discount.end_date);
            return now >= start && now <= end;
          }
          
          return true;
        })
      }));

      setProducts(productsWithActiveDiscounts || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAdd={() => addToCart(product)}
        />
      ))}
    </div>
  );
};

export default ProductGrid;