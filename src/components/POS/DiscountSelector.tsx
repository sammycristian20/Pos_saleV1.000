import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, Search, AlertCircle } from 'lucide-react';
import { Discount } from './types';
import { formatCurrency } from '../../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DiscountSelectorProps {
  onClose: () => void;
  onSelect: (discount: Discount | null) => void;
  selectedDiscount: Discount | null;
  subtotal: number;
}

const DiscountSelector: React.FC<DiscountSelectorProps> = ({
  onClose,
  onSelect,
  selectedDiscount,
  subtotal
}) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      // Filter out discounts that don't meet minimum purchase amount
      const validDiscounts = data.filter(discount => {
        if (!discount.min_purchase_amount) return true;
        return subtotal >= discount.min_purchase_amount;
      });

      setDiscounts(validDiscounts);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setError('Error al cargar los descuentos');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountAmount = (discount: Discount): number => {
    let amount = 0;
    if (discount.type === 'PERCENTAGE') {
      amount = subtotal * (discount.value / 100);
    } else {
      amount = discount.value;
    }

    // Apply maximum discount if set
    if (discount.max_discount_amount && amount > discount.max_discount_amount) {
      amount = discount.max_discount_amount;
    }

    return amount;
  };

  const filteredDiscounts = discounts.filter(discount =>
    discount.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Seleccionar Descuento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="Buscar descuentos..."
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

          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => onSelect(null)}
              className={`w-full p-3 text-left rounded-lg border transition-colors ${
                !selectedDiscount
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <p className="font-medium">Sin descuento</p>
            </button>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando descuentos...</p>
              </div>
            ) : filteredDiscounts.length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                No se encontraron descuentos disponibles
              </p>
            ) : (
              filteredDiscounts.map((discount) => {
                const discountAmount = calculateDiscountAmount(discount);
                return (
                  <button
                    key={discount.id}
                    onClick={() => onSelect(discount)}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      selectedDiscount?.id === discount.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{discount.name}</p>
                        <p className="text-sm text-gray-500">
                          {discount.type === 'PERCENTAGE'
                            ? `${discount.value}% de descuento`
                            : `${formatCurrency(discount.value)} de descuento`}
                        </p>
                      </div>
                      <p className="text-green-600 font-medium">
                        -{formatCurrency(discountAmount)}
                      </p>
                    </div>
                    {discount.min_purchase_amount && (
                      <p className="text-xs text-gray-500 mt-1">
                        Mínimo de compra: {formatCurrency(discount.min_purchase_amount)}
                      </p>
                    )}
                    {discount.max_discount_amount && (
                      <p className="text-xs text-gray-500">
                        Máximo descuento: {formatCurrency(discount.max_discount_amount)}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountSelector;