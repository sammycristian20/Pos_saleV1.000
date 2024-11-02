import React from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category_id: string;
  photos?: {
    id: string;
    photo_url: string;
    is_primary: boolean;
  }[];
  categories?: {
    name: string;
  };
}

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {product.photos && product.photos.length > 0 ? (
              <img
                src={product.photos[0].photo_url}
                alt={product.name}
                className="w-full h-[300px] object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Sin imagen</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Código de Barras</h3>
              <p className="text-lg">{product.barcode}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Precio</h3>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(product.price)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Stock</h3>
              <p className="text-lg">{product.stock} unidades</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Categoría</h3>
              <p className="text-lg">{product.categories?.name || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;