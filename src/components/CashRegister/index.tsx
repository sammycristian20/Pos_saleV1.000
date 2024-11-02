import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DollarSign, Clock, AlertCircle, Plus } from 'lucide-react';
import { CashRegisterSummary } from './types';
import OpenRegisterModal from './OpenRegisterModal';
import CloseRegisterModal from './CloseRegisterModal';
import AddTransactionModal from './AddTransactionModal';
import TransactionList from './TransactionList';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CashRegister: React.FC = () => {
  const [register, setRegister] = useState<CashRegisterSummary | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRegisterStatus();
    }
  }, [user]);

  const fetchRegisterStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_cash_register', {
        p_user_id: user?.id
      });

      if (error) throw error;
      setRegister(data[0] || null);
    } catch (err) {
      console.error('Error fetching register status:', err);
      setError('Error al cargar el estado de la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSuccess = () => {
    setShowOpenModal(false);
    fetchRegisterStatus();
  };

  const handleCloseSuccess = () => {
    setShowCloseModal(false);
    fetchRegisterStatus();
  };

  const handleTransactionSuccess = () => {
    setShowAddTransactionModal(false);
    fetchRegisterStatus();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
        <div className="flex items-center">
          <AlertCircle className="mr-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Caja Registradora</h1>

      {register ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Estado de la Caja</h2>
                <p className="text-sm text-gray-500">
                  Abierta desde: {new Date(register.opening_date).toLocaleString()}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <Clock size={16} className="mr-1" />
                Caja Abierta
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Monto Inicial</p>
                <p className="text-xl font-bold">{formatCurrency(register.initial_cash)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Ventas en Efectivo</p>
                <p className="text-xl font-bold text-green-600">+{formatCurrency(register.total_sales)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Gastos</p>
                <p className="text-xl font-bold text-red-600">-{formatCurrency(register.total_expenses)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Efectivo Esperado</p>
                <p className="text-xl font-bold">{formatCurrency(register.expected_cash)}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setShowAddTransactionModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus size={20} className="inline-block mr-2" />
                Registrar Movimiento
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Cerrar Caja
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-4">Movimientos de Caja</h3>
            <TransactionList registerId={register.id} />
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center">
            <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Caja Cerrada</h2>
            <p className="text-gray-600 mb-6">
              No hay una caja abierta actualmente. Para comenzar a operar, debe abrir la caja.
            </p>
            <button
              onClick={() => setShowOpenModal(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <DollarSign size={20} className="inline-block mr-2" />
              Abrir Caja
            </button>
          </div>
        </div>
      )}

      {showOpenModal && (
        <OpenRegisterModal
          onClose={() => setShowOpenModal(false)}
          onSuccess={handleOpenSuccess}
        />
      )}

      {showCloseModal && register && (
        <CloseRegisterModal
          register={register}
          onClose={() => setShowCloseModal(false)}
          onSuccess={handleCloseSuccess}
        />
      )}

      {showAddTransactionModal && register && (
        <AddTransactionModal
          registerId={register.id}
          onClose={() => setShowAddTransactionModal(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}
    </div>
  );
};

export default CashRegister;