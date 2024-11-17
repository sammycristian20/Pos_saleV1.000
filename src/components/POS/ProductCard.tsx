import React from 'react';
import { Plus, Package } from 'lucide-react';
import { Product } from './types';
import { usePOS } from '../../contexts/POSContext';
import { formatCurrency } from '../../utils/format';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = usePOS();

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="w-32 h-32 mx-auto bg-gray-50 flex items-center justify-center">
        {product.photos && product.photos.length > 0 ? (
          <img
            src={product.photos[0].photo_url}
            alt={product.name}
            className="w-full h-full object-contain p-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x150?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package size={32} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate text-sm mb-1" title={product.name}>
          {product.name}
        </h3>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-base font-bold text-indigo-600">
              {formatCurrency(product.price)}
            </p>
            <p className="text-xs text-gray-500">
              Stock: {product.stock}
            </p>
          </div>
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock <= 0}
            className={`
              p-1.5 rounded-full transition-colors
              ${product.stock > 0
                ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
            title={product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;