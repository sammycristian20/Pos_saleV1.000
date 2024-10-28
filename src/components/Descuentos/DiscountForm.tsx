import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, X } from 'lucide-react';
import { Discount } from '../POS/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
}

interface DiscountFormProps {
  formData: Omit<Discount, 'id'>;
  onSubmit: (e: React.FormEvent, selectedProducts: Product[]) => Promise<void>;
  onChange: (data: Omit<Discount, 'id'>) => void;
  isEditing: boolean;
  onCancel: () => void;
  loading: boolean;
}

const DiscountForm: React.FC<DiscountFormProps> = ({
  formData,
  onSubmit,
  onChange,
  isEditing,
  onCancel,
  loading
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchSelectedProducts();
    }
  }, [isEditing]);

  const fetchSelectedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_discounts')
        .select(`
          product:products (
            id,
            name,
            barcode,
            price
          )
        `)
        .eq('discount_id', formData.id);

      if (error) throw error;

      const products = data?.map(item => item.product) || [];
      setSelectedProducts(products);
    } catch (error) {
      console.error('Error fetching selected products:', error);
    }
  };

  const searchProducts = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, barcode, price')
        .or(`name.ilike.%${term}%,barcode.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;

      // Filter out already selected products
      const filteredResults = (data || []).filter(
        product => !selectedProducts.some(selected => selected.id === product.id)
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    onChange({
      ...formData,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number'
        ? Number(value)
        : value
    });
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProducts([...selectedProducts, product]);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e, selectedProducts);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2">Tipo</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
            disabled={loading}
          >
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED">Monto Fijo</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">
            {formData.type === 'PERCENTAGE' ? 'Porcentaje' : 'Monto'}
          </label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            min="0"
            max={formData.type === 'PERCENTAGE' ? "100" : undefined}
            step={formData.type === 'PERCENTAGE' ? "1" : "0.01"}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2">Monto mínimo de compra</label>
          <input
            type="number"
            name="min_purchase_amount"
            value={formData.min_purchase_amount || ''}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            min="0"
            step="0.01"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2">Descuento máximo</label>
          <input
            type="number"
            name="max_discount_amount"
            value={formData.max_discount_amount || ''}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            min="0"
            step="0.01"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2">Fecha de inicio</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date || ''}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2">Fecha de fin</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date || ''}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>

        <div className="col-span-2">
          <label className="block mb-2">Productos aplicables</label>
          <div className="relative">
            <div className="flex items-center bg-white border rounded">
              <Search className="ml-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowProductSearch(true)}
                className="w-full p-2 rounded focus:outline-none"
                placeholder="Buscar productos por nombre o código..."
                disabled={loading}
              />
            </div>

            {showProductSearch && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {loadingProducts ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2">Buscando productos...</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {searchResults.map((product) => (
                      <li
                        key={product.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              Código: {product.barcode}
                            </p>
                          </div>
                          <p className="text-blue-600 font-medium">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {selectedProducts.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Productos seleccionados:
              </h4>
              <div className="space-y-2">
                {selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        Código: {product.barcode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-red-500 hover:text-red-700"
                      disabled={loading}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              disabled={loading}
            />
            <span>Activo</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-green-300"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditing ? 'Actualizando...' : 'Guardando...'}
            </span>
          ) : (
            isEditing ? 'Actualizar Descuento' : 'Guardar Descuento'
          )}
        </button>
      </div>
    </form>
  );
};

export default DiscountForm;