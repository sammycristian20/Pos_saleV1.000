import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search } from 'lucide-react';
import { Product } from './types';
import { usePOS } from '../../contexts/POSContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ProductSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { addToCart } = usePOS();

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchProducts();
    } else {
      setProducts([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
        .limit(10);

      setProducts(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    addToCart(product);
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-white rounded-lg shadow-sm">
        <Search className="ml-3 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 rounded-lg focus:outline-none"
          placeholder="Buscar productos por nombre o código..."
        />
      </div>

      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Buscando...</div>
          ) : products.length > 0 ? (
            <ul>
              {products.map((product) => (
                <li
                  key={product.id}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">Código: {product.barcode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">${product.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">No se encontraron productos</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;