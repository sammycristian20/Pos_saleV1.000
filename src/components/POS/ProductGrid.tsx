import React from 'react';
import ProductCard from './ProductCard';
import { Product } from './types';
import { usePOS } from '../../contexts/POSContext';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, error }) => {
  const { addToCart } = usePOS();

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

  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg">No se encontraron productos</p>
        <p className="text-sm">Intente con otra búsqueda</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-max">
        {products.map((product) => (
          <div key={product.id} className="flex">
            <ProductCard
              product={product}
              onAdd={() => addToCart(product)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;