import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { CashRegisterSummary } from './types';
import { formatCurrency } from '../../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CloseRegisterModalProps {
  register: CashRegisterSummary;
  onClose: () => void;
  onSuccess: () => void;
}

const CloseRegisterModal: React.FC<CloseRegisterModalProps> = ({
  register,
  onClose,
  onSuccess
}) => {
  const [finalCash, setFinalCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [difference, setDifference] = useState<number>(0);

  useEffect(() => {
    const amount = parseFloat(finalCash);
    if (!isNaN(amount)) {
      setDifference(amount - register.expected_cash);
    } else {
      setDifference(0);
    }
  }, [finalCash, register.expected_cash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const amount = parseFloat(finalCash);
      if (isNaN(amount) || amount < 0) {
        throw new Error('El monto final debe ser un número válido mayor o igual a 0');
      }

      const { data, error: closeError } = await supabase
        .rpc('close_cash_register', {
          p_register_id: register.id,
          p_final_cash: amount,
          p_notes: notes || null
        });

      if (closeError) throw closeError;

      onSuccess();
    } catch (err) {
      console.error('Error closing cash register:', err);
      setError(err instanceof Error ? err.message : 'Error al cerrar la caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cierre de Caja</h2>
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
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Monto Inicial:</p>
            <p className="font-medium">{formatCurrency(register.initial_cash)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ventas en Efectivo:</p>
            <p className="font-medium">{formatCurrency(register.total_sales)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Gastos:</p>
            <p className="font-medium text-red-600">-{formatCurrency(register.total_expenses)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Retiros:</p>
            <p className="font-medium text-red-600">-{formatCurrency(register.total_withdrawals)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Depósitos:</p>
            <p className="font-medium text-green-600">{formatCurrency(register.total_deposits)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Efectivo Esperado:</p>
            <p className="font-bold">{formatCurrency(register.expected_cash)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Final en Efectivo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="text-gray-400" size={20} />
              </div>
              <input
                type="number"
                value={finalCash}
                onChange={(e) => setFinalCash(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                disabled={loading}
              />
            </div>
          </div>

          {finalCash && (
            <div className="mb-4">
              <div className={`p-3 rounded-lg ${
                difference === 0 
                  ? 'bg-green-100 text-green-800'
                  : difference > 0
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className="flex items-center">
                  <AlertCircle className="mr-2" size={20} />
                  <div>
                    <p className="font-medium">
                      {difference === 0 
                        ? 'El monto coincide con lo esperado'
                        : difference > 0
                        ? `Hay un sobrante de ${formatCurrency(difference)}`
                        : `Hay un faltante de ${formatCurrency(Math.abs(difference))}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
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
                Cerrando caja...
              </>
            ) : (
              'Cerrar Caja'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CloseRegisterModal;