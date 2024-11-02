import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search } from 'lucide-react';
import { Product } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductSearchProps {
  onProductsFound: (products: Product[]) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ 
  onProductsFound, 
  onLoading, 
  onError 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const searchProducts = async (term: string) => {
    if (term.length < 2) {
      onProductsFound([]);
      return;
    }

    onLoading(true);
    onError(null);

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
        .or(`name.ilike.%${term}%,barcode.ilike.%${term}%`)
        .order('name')
        .limit(8); // Limit to 8 products per search

      if (error) throw error;

      // Filter out inactive discounts and check dates
      const productsWithActiveDiscounts = (data || []).map(product => ({
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

      onProductsFound(productsWithActiveDiscounts);
    } catch (err) {
      console.error('Error searching products:', err);
      onError('Error al buscar productos');
    } finally {
      onLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Use debounce to avoid too many requests
    const timeoutId = setTimeout(() => {
      searchProducts(term);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-white rounded-lg shadow-sm">
        <Search className="ml-3 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-3 rounded-lg focus:outline-none"
          placeholder="Buscar productos por nombre o código..."
        />
      </div>
    </div>
  );
};

export default ProductSearch;