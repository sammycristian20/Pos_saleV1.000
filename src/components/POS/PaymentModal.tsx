import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, DollarSign, CreditCard, Banknote, FileText } from 'lucide-react';
import { usePOS } from '../../contexts/POSContext';
import { useCashRegister } from '../../contexts/CashRegisterContext';
import { formatCurrency } from '../../utils/format';
import type { FiscalDocumentType } from './types';
import Big from 'big.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface PaymentModalProps {
  onClose: () => void;
  onComplete: (sale: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onComplete }) => {
  const { cartTotal, selectedClient, processSale } = usePOS();
  const { register, refreshRegister } = useCashRegister();
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>(cartTotal.toString());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [fiscalSequences, setFiscalSequences] = useState<any[]>([]);
  const [selectedFiscalType, setSelectedFiscalType] = useState<FiscalDocumentType | ''>('');

  useEffect(() => {
    if (!selectedClient) {
      setSelectedFiscalType('CONSUMO');
    }
    fetchFiscalSequences();
  }, [selectedClient]);

  const fetchFiscalSequences = async () => {
    try {
      const { data, error } = await supabase
        .from('fiscal_sequences')
        .select('*')
        .eq('active', true)
        .order('document_type');

      if (error) throw error;
      setFiscalSequences(data || []);
    } catch (err) {
      console.error('Error fetching fiscal sequences:', err);
      setError('Error al cargar los tipos de comprobantes fiscales');
    }
  };

  const validatePayment = () => {
    if (!selectedFiscalType) {
      throw new Error('Debe seleccionar un tipo de comprobante fiscal');
    }

    if (paymentMethod === 'CASH') {
      if (!register) {
        throw new Error('No hay una caja abierta para recibir pagos en efectivo');
      }

      const tenderedAmount = new Big(amountTendered || '0');
      const total = new Big(cartTotal);

      if (tenderedAmount.lt(total)) {
        throw new Error('El monto recibido es menor al total');
      }
    }

    if ((paymentMethod === 'CARD' || paymentMethod === 'TRANSFER') && !referenceNumber) {
      throw new Error('El número de referencia es requerido');
    }
  };

  const calculateChange = (): string => {
    try {
      const tenderedAmount = new Big(amountTendered || '0');
      const total = new Big(cartTotal);
      return tenderedAmount.minus(total).toFixed(2);
    } catch (err) {
      return '0.00';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;

    setError(null);
    setProcessing(true);

    try {
      // Validate payment details
      validatePayment();

      const tenderedAmount = new Big(amountTendered || '0');
      const changeAmount = new Big(calculateChange());

      const paymentDetails = {
        method: paymentMethod,
        amount_tendered: Number(tenderedAmount),
        change_amount: Number(changeAmount),
        reference_number: referenceNumber || undefined,
        authorization_code: authorizationCode || undefined,
        fiscal_document_type: selectedFiscalType,
        fiscal_number: ''
      };

      const result = await processSale(paymentDetails);

      if (!result) {
        throw new Error('Error al procesar la venta');
      }

      // Register cash transaction if applicable
      if (paymentMethod === 'CASH' && register) {
        const { error: transactionError } = await supabase.rpc('add_register_transaction', {
          p_register_id: register.id,
          p_type: 'SALE',
          p_amount: cartTotal,
          p_payment_method: 'CASH',
          p_reference_id: result.id,
          p_notes: `Venta #${result.fiscal_number || result.id}`
        });

        if (transactionError) {
          console.error('Error registering cash transaction:', transactionError);
          throw transactionError;
        }

        // Update register totals
        await refreshRegister();
      }

      onComplete(result);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setProcessing(false);
    }
  };

  const getFiscalTypeLabel = (type: FiscalDocumentType): string => {
    const labels: Record<FiscalDocumentType, string> = {
      'CREDITO_FISCAL': 'Crédito Fiscal (31)',
      'CONSUMO': 'Consumo (32)',
      'NOTA_DEBITO': 'Nota de Débito (33)',
      'NOTA_CREDITO': 'Nota de Crédito (34)',
      'COMPRAS': 'Compras (41)',
      'GASTOS_MENORES': 'Gastos Menores (43)',
      'REGIMENES_ESPECIALES': 'Regímenes Especiales (44)',
      'GUBERNAMENTAL': 'Gubernamental (45)'
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Procesar Pago</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={processing}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Comprobante Fiscal
            </label>
            <select
              value={selectedFiscalType}
              onChange={(e) => setSelectedFiscalType(e.target.value as FiscalDocumentType)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={processing}
            >
              <option value="">Seleccionar tipo de comprobante</option>
              {fiscalSequences.map((seq) => (
                <option 
                  key={seq.id} 
                  value={seq.document_type}
                >
                  {getFiscalTypeLabel(seq.document_type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 flex items-center justify-center rounded-lg border ${
                  paymentMethod === 'CASH'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : !register
                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={processing || !register}
                title={!register ? 'Debe abrir la caja para recibir pagos en efectivo' : undefined}
              >
                <DollarSign size={20} className="mr-2" />
                Efectivo
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 flex items-center justify-center rounded-lg border ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={processing}
              >
                <CreditCard size={20} className="mr-2" />
                Tarjeta
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`p-3 flex items-center justify-center rounded-lg border ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={processing}
              >
                <Banknote size={20} className="mr-2" />
                Transferencia
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT')}
                className={`p-3 flex items-center justify-center rounded-lg border ${
                  paymentMethod === 'CREDIT'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={processing}
              >
                <FileText size={20} className="mr-2" />
                Crédito
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total a Pagar
            </label>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(cartTotal)}
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Recibido
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={cartTotal}
                    step="0.01"
                    required
                    disabled={processing}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cambio
                </label>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(Number(calculateChange()))}
                </div>
              </div>
            </>
          )}

          {(paymentMethod === 'CARD' || paymentMethod === 'TRANSFER') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Referencia
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={processing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Autorización
                </label>
                <input
                  type="text"
                  value={authorizationCode}
                  onChange={(e) => setAuthorizationCode(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={processing}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={processing || !selectedFiscalType || (paymentMethod === 'CASH' && !register)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
          >
            {processing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Procesando...
              </div>
            ) : (
              'Completar Venta'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;