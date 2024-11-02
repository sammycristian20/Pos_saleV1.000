import React, { useState } from 'react';
import { POSProvider } from '../../contexts/POSContext';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import ProductSearch from './ProductSearch';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import ClientSearch from './ClientSearch';
import PaymentModal from './PaymentModal';
import TransactionList from '../CashRegister/TransactionList';
import { Sale, Product } from './types';
import { Receipt, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const POS: React.FC = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const { register, loading, error, refreshRegister } = useCashRegister();
  const [showTransactions, setShowTransactions] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSaleComplete = async (sale: any) => {
    try {
      if (register && sale.payment_method === 'CASH') {
        // Register the cash sale in cash_register_transactions
        const { error: transactionError } = await supabase.rpc('add_register_transaction', {
          p_register_id: register.id,
          p_type: 'SALE',
          p_amount: sale.total_amount,
          p_payment_method: 'CASH',
          p_reference_id: sale.id,
          p_notes: `Venta #${sale.fiscal_number || sale.id}`
        });

        if (transactionError) {
          console.error('Error registering cash transaction:', transactionError);
          throw transactionError;
        }

        // Refresh register data to update totals
        await refreshRegister();
      }

      setLastSale(sale);
      setShowPaymentModal(false);
    } catch (err) {
      console.error('Error processing sale completion:', err);
    }
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

  if (!register) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8 rounded-lg">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Caja Cerrada</h2>
        <p className="text-gray-600 text-center mb-6">
          Para poder realizar ventas, primero debe abrir la caja registradora.
        </p>
        <Link
          to="/caja"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Ir a Caja Registradora
        </Link>
      </div>
    );
  }

  return (
    <POSProvider>
      <div className="h-full flex flex-col">
        <div className="flex-1 flex">
          {/* Products Section */}
          <div className="flex-1 pr-6 overflow-y-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-6">Punto de Venta</h1>
              <ProductSearch 
                onProductsFound={setProducts}
                onLoading={setSearchLoading}
                onError={setSearchError}
              />
            </div>
            <ProductGrid 
              products={products}
              loading={searchLoading}
              error={searchError}
            />
          </div>

          {/* Cart Section */}
          <div className="w-96 flex flex-col">
            <div className="mb-4">
              <ClientSearch />
            </div>
            <div className="flex-1">
              <Cart />
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        {register && (
          <div className="mt-6">
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Receipt size={20} className="mr-2 text-gray-500" />
                <span className="font-medium">Movimientos de Caja</span>
              </div>
              {showTransactions ? (
                <ChevronUp size={20} className="text-gray-500" />
              ) : (
                <ChevronDown size={20} className="text-gray-500" />
              )}
            </button>
            
            {showTransactions && (
              <div className="mt-2 bg-white p-6 rounded-lg shadow">
                <TransactionList registerId={register.id} />
              </div>
            )}
          </div>
        )}

        {showPaymentModal && (
          <PaymentModal
            onClose={() => setShowPaymentModal(false)}
            onComplete={handleSaleComplete}
          />
        )}
      </div>
    </POSProvider>
  );
};

export default POS;