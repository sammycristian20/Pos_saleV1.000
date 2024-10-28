import React, { useState } from 'react';
import { POSProvider } from '../../contexts/POSContext';
import ProductSearch from './ProductSearch';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import ClientSearch from './ClientSearch';
import PaymentModal from './PaymentModal';
import { Sale } from './types';
import { Receipt } from 'lucide-react';

const POS: React.FC = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const handleSaleComplete = (sale: Sale) => {
    setLastSale(sale);
    setShowPaymentModal(false);
    // TODO: Print receipt or show receipt modal
  };

  return (
    <POSProvider>
      <div className="h-full flex">
        {/* Products Section */}
        <div className="flex-1 pr-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-6">Punto de Venta</h1>
            <ProductSearch />
          </div>
          <ProductGrid />
        </div>

        {/* Cart Section */}
        <div className="w-96 flex flex-col">
          <div className="mb-4">
            <ClientSearch />
          </div>
          <div className="flex-1">
            <Cart />
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Receipt className="mr-2" size={20} />
            Procesar Venta
          </button>
        </div>

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