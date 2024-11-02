import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { Product } from './types';
import { usePOS } from '../../contexts/POSContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCTS_PER_PAGE = 8; // Set to exactly 8 products per page

const ProductGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const { addToCart } = usePOS();

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // First, get the count of all products
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalProducts(count || 0);

      // Then fetch the paginated products
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
        .range(
          (currentPage - 1) * PRODUCTS_PER_PAGE, 
          currentPage * PRODUCTS_PER_PAGE - 1
        )
        .order('name');

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

      setProducts(productsWithActiveDiscounts || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex justify-center items-center">
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
    <div className="h-full flex flex-col">
      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={() => addToCart(product)}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex-1 flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Mostrando{' '}
            <span className="font-medium">
              {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}
            </span>{' '}
            a{' '}
            <span className="font-medium">
              {Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts)}
            </span>{' '}
            de{' '}
            <span className="font-medium">{totalProducts}</span>{' '}
            productos
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;