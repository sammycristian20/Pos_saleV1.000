import React, { useState } from 'react';
import { Trash2, Plus, Minus, Tag, ShoppingBag } from 'lucide-react';
import { usePOS } from '../../contexts/POSContext';
import PaymentModal from './PaymentModal';
import DiscountSelector from './DiscountSelector';
import ReceiptModal from './ReceiptModal';
import { formatCurrency } from '../../utils/format';

const Cart: React.FC = () => {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity,
    cartTotal,
    cartSubtotal,
    cartTax,
    selectedDiscount,
    discountAmount,
    setSelectedDiscount,
    clearCart
  } = usePOS();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountSelector, setShowDiscountSelector] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  const handlePaymentComplete = (sale: any) => {
    setShowPaymentModal(false);
    setCompletedSale(sale);
  };

  const handleReceiptClose = () => {
    setCompletedSale(null);
    clearCart();
  };

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white rounded-lg shadow-sm p-4">
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="w-24 h-24 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-lg font-medium">Carrito vacío</p>
          <p className="text-sm">Agregue productos para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Orden actual</h2>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.id} className="p-4 border-b hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="p-1 hover:bg-gray-200 rounded-l-lg text-gray-500 hover:text-gray-700"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 hover:bg-gray-200 rounded-r-lg text-gray-500 hover:text-gray-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t p-4">
        {/* Discount Section */}
        <button
          onClick={() => setShowDiscountSelector(true)}
          className="w-full mb-4 py-2 px-4 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center"
        >
          <Tag size={16} className="mr-2" />
          {selectedDiscount ? 'Cambiar descuento' : 'Agregar descuento'}
        </button>

        {selectedDiscount && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-green-800">{selectedDiscount.name}</p>
                <p className="text-sm text-green-600">
                  {selectedDiscount.type === 'PERCENTAGE' 
                    ? `${selectedDiscount.value}% de descuento`
                    : `${formatCurrency(selectedDiscount.value)} de descuento`}
                </p>
              </div>
              <span className="text-green-600 font-medium">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(cartSubtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>ITBIS (18%)</span>
            <span>{formatCurrency(cartTax)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => clearCart()}
            className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
          >
            <Trash2 size={20} className="mr-2" />
            Cancelar
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <ShoppingBag size={20} className="mr-2" />
            Procesar Venta
          </button>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onComplete={handlePaymentComplete}
        />
      )}

      {showDiscountSelector && (
        <DiscountSelector
          onClose={() => setShowDiscountSelector(false)}
          onSelect={(discount) => {
            setSelectedDiscount(discount);
            setShowDiscountSelector(false);
          }}
          selectedDiscount={selectedDiscount}
          subtotal={cartSubtotal}
        />
      )}

      {completedSale && (
        <ReceiptModal
          invoice={completedSale}
          onClose={handleReceiptClose}
          autoPrint={true}
        />
      )}
    </div>
  );
};

export default Cart;