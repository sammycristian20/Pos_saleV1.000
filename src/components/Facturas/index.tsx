import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FileText, Search, AlertCircle, Ban, Eye } from 'lucide-react';
import InvoiceDetails from './InvoiceDetails';
import { Invoice } from '../POS/types';
import { formatCurrency, formatDate } from '../../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Facturas: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers (
            name,
            document,
            document_type
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
            ),
            item_discount:discounts (
              name,
              type,
              value
            )
          ),
          invoice_discount:discounts (
            name,
            type,
            value
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    if (!window.confirm('¿Está seguro de que desea anular esta factura? Esta acción restaurará el inventario.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('cancel_invoice', {
        invoice_id: invoice.id
      });

      if (error) throw error;

      await fetchInvoices();
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Error canceling invoice:', err);
      setError('Error al anular la factura');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    const customerName = (invoice as any).customer?.name?.toLowerCase() || '';
    const customerDocument = (invoice as any).customer?.document?.toLowerCase() || '';
    return customerName.includes(searchLower) || 
           customerDocument.includes(searchLower) ||
           invoice.id.toLowerCase().includes(searchLower);
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pagada';
      case 'CANCELLED':
        return 'Anulada';
      case 'PENDING':
        return 'Pendiente';
      case 'REFUNDED':
        return 'Reembolsada';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Facturas</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Buscar facturas..."
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Factura</th>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Subtotal</th>
              <th className="p-3 text-left">Descuento</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-3 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Cargando facturas...</span>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-3 text-center text-gray-500">
                  No se encontraron facturas
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center">
                      <FileText size={16} className="mr-2 text-gray-400" />
                      <span className="font-medium">{invoice.id.slice(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">
                        {(invoice as any).customer?.name || 'Cliente General'}
                      </p>
                      {(invoice as any).customer?.document && (
                        <p className="text-sm text-gray-500">
                          {(invoice as any).customer?.document_type}: {(invoice as any).customer?.document}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{formatDate(invoice.created_at)}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </td>
                  <td className="p-3">
                    {invoice.discount_amount > 0 ? (
                      <div>
                        <span className="text-green-600">-{formatCurrency(invoice.discount_amount)}</span>
                        {(invoice as any).invoice_discount && (
                          <p className="text-xs text-gray-500">{(invoice as any).invoice_discount.name}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50"
                        title="Ver detalles"
                      >
                        <Eye size={20} />
                      </button>
                      {invoice.status === 'PAID' && (
                        <button
                          onClick={() => handleCancelInvoice(invoice)}
                          className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                          title="Anular factura"
                        >
                          <Ban size={20} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <InvoiceDetails
              invoice={selectedInvoice}
              onCancel={handleCancelInvoice}
              onClose={() => setSelectedInvoice(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturas;