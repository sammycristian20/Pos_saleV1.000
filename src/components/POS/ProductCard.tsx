import React from 'react';
import { Plus, Package } from 'lucide-react';
import { Product } from './types';
import { formatCurrency } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center">
        {product.photos && product.photos.length > 0 ? (
          <img
            src={product.photos[0].photo_url}
            alt={product.name}
            className="w-[300px] h-[300px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package size={48} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate" title={product.name}>
          {product.name}
        </h3>
        <div className="mt-2 flex justify-between items-center">
          <div>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(product.price)}
            </p>
            <p className="text-sm text-gray-500">
              Stock: {product.stock}
            </p>
          </div>
          <button
            onClick={onAdd}
            disabled={product.stock <= 0}
            className={`
              p-2 rounded-full transition-colors
              ${product.stock > 0
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
            title={product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;