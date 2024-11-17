import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, Printer, Eye, Search, AlertCircle, Package as PackageIcon } from 'lucide-react';
import BulkUpload from './BulkUpload';
import BarcodePrinting from '../BarcodePrinting';
import ProductModal from './ProductModal';
import InventoryEntry from './InventoryEntry';
import { formatCurrency } from '../../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

const Inventario: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showBarcodePrinting, setShowBarcodePrinting] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showInventoryEntry, setShowInventoryEntry] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          photos:product_photos (
            id,
            photo_url,
            is_primary
          ),
          categories:categories (
            name
          )
        `)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    if (term.length < 2) {
      await fetchProducts();
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          photos:product_photos (
            id,
            photo_url,
            is_primary
          ),
          categories:categories (
            name
          )
        `)
        .or(`name.ilike.%${term}%,barcode.ilike.%${term}%`)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Error al buscar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Error al eliminar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center hover:bg-blue-600"
          >
            <Plus size={20} className="mr-2" />
            Nuevo Producto
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center hover:bg-green-600"
          >
            <Plus size={20} className="mr-2" />
            Carga Masiva
          </button>
          <button
            onClick={() => setShowBarcodePrinting(true)}
            className="bg-purple-500 text-white px-4 py-2 rounded flex items-center hover:bg-purple-600"
          >
            <Printer size={20} className="mr-2" />
            Imprimir Códigos
          </button>
          <button
            onClick={() => setShowInventoryEntry(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded flex items-center hover:bg-orange-600"
          >
            <Plus size={20} className="mr-2" />
            Movimiento
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Buscar productos por nombre o código..."
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <AlertCircle className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.photos && product.photos.length > 0 ? (
                        <img
                          src={product.photos[0].photo_url}
                          alt={product.name}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40x40?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <PackageIcon size={20} className="text-gray-500" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{product.barcode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {product.categories?.name || 'Sin categoría'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-medium ${
                      product.stock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showBarcodePrinting && (
        <BarcodePrinting
          products={products}
          onClose={() => setShowBarcodePrinting(false)}
        />
      )}

      {showBulkUpload && (
        <BulkUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={fetchProducts}
        />
      )}

      {showInventoryEntry && (
        <InventoryEntry
          onClose={() => setShowInventoryEntry(false)}
          onSuccess={fetchProducts}
        />
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Inventario;