import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowUpRight, ArrowDownLeft, DollarSign, CreditCard, Banknote, FileText } from 'lucide-react';
import { CashRegisterTransaction } from './types';
import { formatCurrency, formatDate } from '../../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TransactionListProps {
  registerId: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ registerId }) => {
  const [transactions, setTransactions] = React.useState<CashRegisterTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchTransactions();
  }, [registerId]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_register_transactions')
        .select('*')
        .eq('cash_register_id', registerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Error al cargar los movimientos');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'SALE':
        return <ArrowUpRight className="text-green-500" />;
      case 'EXPENSE':
        return <ArrowDownLeft className="text-red-500" />;
      case 'WITHDRAWAL':
        return <ArrowDownLeft className="text-orange-500" />;
      case 'DEPOSIT':
        return <ArrowUpRight className="text-blue-500" />;
      default:
        return <DollarSign className="text-gray-500" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <DollarSign size={16} />;
      case 'CARD':
        return <CreditCard size={16} />;
      case 'TRANSFER':
        return <Banknote size={16} />;
      case 'CREDIT':
        return <FileText size={16} />;
      default:
        return null;
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'SALE':
        return 'Venta';
      case 'EXPENSE':
        return 'Gasto';
      case 'WITHDRAWAL':
        return 'Retiro';
      case 'DEPOSIT':
        return 'Depósito';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay movimientos registrados
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">Tipo</th>
            <th className="px-4 py-2 text-left">Método</th>
            <th className="px-4 py-2 text-left">Referencia</th>
            <th className="px-4 py-2 text-left">Fecha</th>
            <th className="px-4 py-2 text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="border-t">
              <td className="px-4 py-2">
                <div className="flex items-center">
                  {getTransactionIcon(transaction.transaction_type)}
                  <span className="ml-2">
                    {getTransactionTypeText(transaction.transaction_type)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center">
                  {getPaymentMethodIcon(transaction.payment_method)}
                  <span className="ml-1">{transaction.payment_method}</span>
                </div>
              </td>
              <td className="px-4 py-2">
                {transaction.reference_id ? (
                  <span className="text-sm font-mono">
                    {transaction.reference_id.slice(0, 8)}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-2">
                <span className="text-sm">
                  {formatDate(transaction.created_at)}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                <span className={
                  transaction.transaction_type === 'SALE' || transaction.transaction_type === 'DEPOSIT'
                    ? 'text-green-600'
                    : 'text-red-600'
                }>
                  {transaction.transaction_type === 'SALE' || transaction.transaction_type === 'DEPOSIT'
                    ? '+'
                    : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;