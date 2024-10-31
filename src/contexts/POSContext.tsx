import React, { createContext, useContext, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Product, CartItem, Client, Sale, PaymentDetails, Discount, FiscalDocumentType } from '../components/POS/types';
import { useAuth } from './AuthContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TAX_RATE = 0.18; // 18% ITBIS
const DEFAULT_CLIENT_ID = '00000000-0000-0000-0000-000000000000'; // Consumidor Final

interface POSContextType {
  cart: CartItem[];
  selectedClient: Client | null;
  selectedDiscount: Discount | null;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSelectedClient: (client: Client | null) => void;
  setSelectedDiscount: (discount: Discount | null) => void;
  cartTotal: number;
  cartSubtotal: number;
  cartTax: number;
  discountAmount: number;
  showPayment: boolean;
  setShowPayment: (show: boolean) => void;
  processSale: (paymentDetails: PaymentDetails) => Promise<any>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { user } = useAuth();

  const calculateItemTotals = (item: CartItem): CartItem => {
    const subtotal = Number((item.price * item.quantity).toFixed(2));
    const tax_amount = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + tax_amount).toFixed(2));
    
    return {
      ...item,
      subtotal,
      tax_amount,
      total
    };
  };

  const addToCart = useCallback((product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return currentCart;
        }
        return currentCart.map(item =>
          item.id === product.id
            ? calculateItemTotals({ ...item, quantity: item.quantity + 1 })
            : item
        );
      }

      return [...currentCart, calculateItemTotals({ 
        ...product, 
        quantity: 1, 
        subtotal: 0, 
        tax_amount: 0, 
        total: 0 
      })];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(currentCart =>
      currentCart.map(item =>
        item.id === productId
          ? calculateItemTotals({ ...item, quantity })
          : item
      ).filter(item => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedClient(null);
    setSelectedDiscount(null);
    setShowPayment(false);
  }, []);

  const cartSubtotal = Number(cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const cartTax = Number(cart.reduce((sum, item) => sum + item.tax_amount, 0).toFixed(2));

  // Calculate discount amount
  const discountAmount = selectedDiscount
    ? selectedDiscount.type === 'PERCENTAGE'
      ? Number((cartSubtotal * (selectedDiscount.value / 100)).toFixed(2))
      : Number(selectedDiscount.value.toFixed(2))
    : 0;

  // Apply maximum discount if set
  const finalDiscountAmount = selectedDiscount?.max_discount_amount && discountAmount > selectedDiscount.max_discount_amount
    ? selectedDiscount.max_discount_amount
    : discountAmount;

  const cartTotal = Number((cartSubtotal + cartTax - finalDiscountAmount).toFixed(2));

  const processSale = async (paymentDetails: PaymentDetails) => {
    if (!user) throw new Error('Usuario no autenticado');
    if (cart.length === 0) throw new Error('El carrito está vacío');

    // Determine fiscal document type based on client type
    let fiscalDocumentType: FiscalDocumentType | undefined;
    if (selectedClient) {
      fiscalDocumentType = selectedClient.client_type === 'BUSINESS' 
        ? 'CREDITO_FISCAL' 
        : 'CONSUMO';
    } else {
      fiscalDocumentType = 'CONSUMO'; // Default for walk-in customers
    }

    const sale: Sale = {
      customer_id: selectedClient?.id || DEFAULT_CLIENT_ID,
      subtotal: cartSubtotal,
      tax_amount: cartTax,
      total_amount: cartTotal,
      discount_amount: finalDiscountAmount,
      discount_id: selectedDiscount?.id,
      payment_method: paymentDetails.method,
      amount_paid: paymentDetails.amount_tendered,
      change_amount: paymentDetails.change_amount,
      fiscal_document_type: fiscalDocumentType,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        tax_rate: TAX_RATE,
        tax_amount: item.tax_amount,
        subtotal: item.subtotal,
        total: item.total,
        discount_amount: item.discount_amount
      }))
    };

    try {
      // Create the sale
      const { data: saleData, error: saleError } = await supabase.rpc('create_sale', {
        sale_data: sale
      });

      if (saleError) throw saleError;

      // Fetch the complete invoice data
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers (
            name,
            document,
            document_type,
            client_type
          ),
          payment:payments (
            payment_method,
            reference_number,
            authorization_code
          ),
          items:invoice_items (
            *,
            product:products (
              name,
              barcode
            )
          )
        `)
        .eq('id', saleData.invoice_id)
        .single();

      if (invoiceError) throw invoiceError;

      clearCart();
      return invoiceData;
    } catch (error) {
      console.error('Error processing sale:', error);
      throw error;
    }
  };

  const value = {
    cart,
    selectedClient,
    selectedDiscount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setSelectedClient,
    setSelectedDiscount,
    cartTotal,
    cartSubtotal,
    cartTax,
    discountAmount: finalDiscountAmount,
    showPayment,
    setShowPayment,
    processSale
  };

  return (
    <POSContext.Provider value={value}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};