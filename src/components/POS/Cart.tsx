import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, Tag } from 'lucide-react';
import { usePOS } from '../../contexts/POSContext';
import PaymentModal from './PaymentModal';
import DiscountSelector from './DiscountSelector';
import { formatCurrency } from '../../utils/format';

const Cart: React.FC = () => {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity,
    cartTotal,
    cartSubtotal,
    cartTax,
    showPayment,
    setShowPayment,
    selectedDiscount,
    discountAmount,
    handleCompleteSale,
    setSelectedDiscount
  } = usePOS();

  const [showDiscountSelector, setShowDiscountSelector] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <ShoppingCart size={48} className="mb-4" />
        <p className="text-lg">El carrito está vacío</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center p-4 border-b">
            <div className="flex-1">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-gray-500">
                {formatCurrency(item.price)} x {item.quantity}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => removeFromCart(item.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded-full"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-4 bg-white">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(cartSubtotal)}</span>
          </div>
          
          {/* Discount Section */}
          <div className="py-2 border-t border-b">
            <button
              onClick={() => setShowDiscountSelector(true)}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <Tag size={16} className="mr-2" />
              {selectedDiscount ? 'Cambiar descuento' : 'Agregar descuento'}
            </button>
            
            {selectedDiscount && (
              <div className="mt-2">
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento ({selectedDiscount.name}):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between text-sm">
            <span>ITBIS (18%):</span>
            <span>{formatCurrency(cartTax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
        </div>

        <button
          onClick={() => setShowPayment(true)}
          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Procesar Pago
        </button>
      </div>

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onComplete={handleCompleteSale}
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
    </div>
  );
};

export default Cart;