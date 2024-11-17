import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Minus, Search, AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: string;
  name: string;
  barcode: string;
  stock: number;
  price: number;
}

interface InventoryEntryProps {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

type EntryType = 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'DEFECT';

const InventoryEntry: React.FC<InventoryEntryProps> = ({ onClose, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [entryType, setEntryType] = useState<EntryType>('PURCHASE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const searchProducts = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, barcode, stock, price')
        .or(`name.ilike.%${term}%,barcode.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Error al buscar productos');
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate quantity
      if (entryType === 'DEFECT' || entryType === 'RETURN') {
        if (quantity > selectedProduct.stock) {
          throw new Error('La cantidad no puede ser mayor al stock actual');
        }
      }

      // Create inventory entry
      const { error: entryError } = await supabase
        .from('inventory_entries')
        .insert([{
          product_id: selectedProduct.id,
          entry_type: entryType,
          quantity: entryType === 'DEFECT' || entryType === 'RETURN' ? -quantity : quantity,
          notes: notes || null
        }]);

      if (entryError) throw entryError;

      // Update product stock
      const newStock = entryType === 'DEFECT' || entryType === 'RETURN'
        ? selectedProduct.stock - quantity
        : selectedProduct.stock + quantity;

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      setSuccess('Movimiento de inventario registrado exitosamente');
      await onSuccess();
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('Error processing inventory entry:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Movimiento de Inventario</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
            <div className="flex items-center">
              <AlertCircle className="mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700">
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Producto
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchProducts(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar por nombre o código..."
                disabled={loading}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
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
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(product.price)}</p>
                        <p className="text-sm text-gray-500">
                          Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Producto Seleccionado</h3>
                <p className="text-lg font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">Código: {selectedProduct.barcode}</p>
                <p className="text-sm text-gray-500">Stock Actual: {selectedProduct.stock}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Movimiento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryType('PURCHASE')}
                    className={`p-3 flex items-center justify-center rounded-lg border ${
                      entryType === 'PURCHASE'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Plus size={20} className="mr-2" />
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryType('DEFECT')}
                    className={`p-3 flex items-center justify-center rounded-lg border ${
                      entryType === 'DEFECT'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Minus size={20} className="mr-2" />
                    Salida
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Agregar notas o comentarios..."
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  'Registrar Movimiento'
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default InventoryEntry;