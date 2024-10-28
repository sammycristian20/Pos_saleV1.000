import React from 'react';
import { X, Printer, Ban, Download } from 'lucide-react';
import { Invoice } from '../POS/types';
import { formatCurrency, formatDate } from '../../utils/format';

interface InvoiceDetailsProps {
  invoice: Invoice;
  onCancel: (invoice: Invoice) => Promise<void>;
  onClose: () => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice, onCancel, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implementar la generación y descarga del PDF
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Detalles de Factura</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Número de Factura</p>
            <p className="font-medium">{invoice.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="font-medium">{formatDate(invoice.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="font-medium">
              {(invoice as any).customer?.name || 'Cliente General'}
            </p>
            {(invoice as any).customer?.document && (
              <p className="text-sm text-gray-500">
                {(invoice as any).customer?.document_type}: {(invoice as any).customer?.document}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
              invoice.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {invoice.status === 'PAID' ? 'Pagada' :
               invoice.status === 'CANCELLED' ? 'Anulada' :
               invoice.status === 'PENDING' ? 'Pendiente' : 'Reembolsada'}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Productos</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="text-sm text-gray-500">
                  <th className="text-left pb-2">Producto</th>
                  <th className="text-right pb-2">Cant.</th>
                  <th className="text-right pb-2">Precio</th>
                  <th className="text-right pb-2">Subtotal</th>
                  {(invoice as any).items?.some((item: any) => item.discount_amount > 0) && (
                    <th className="text-right pb-2">Descuento</th>
                  )}
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice as any).items?.map((item: any) => (
                  <tr key={item.id} className="border-t border-gray-200">
                    <td className="py-2">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-500">{item.product.barcode}</p>
                    </td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right py-2">{formatCurrency(item.subtotal)}</td>
                    {(invoice as any).items?.some((i: any) => i.discount_amount > 0) && (
                      <td className="text-right py-2 text-green-600">
                        {item.discount_amount > 0 ? (
                          <div>
                            -{formatCurrency(item.discount_amount)}
                            {item.item_discount && (
                              <p className="text-xs">{item.item_discount.name}</p>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                    )}
                    <td className="text-right py-2">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center">
                Descuento
                {(invoice as any).invoice_discount && (
                  <span className="ml-1 text-xs">
                    ({(invoice as any).invoice_discount.name})
                  </span>
                )}:
              </span>
              <span>-{formatCurrency(invoice.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>ITBIS (18%):</span>
            <span>{formatCurrency(invoice.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>

        {(invoice as any).payment && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium mb-2">Información de Pago</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Método de pago:</span>
                <span>{(invoice as any).payment.payment_method}</span>
              </div>
              {(invoice as any).payment.reference_number && (
                <div className="flex justify-between text-sm">
                  <span>Número de referencia:</span>
                  <span>{(invoice as any).payment.reference_number}</span>
                </div>
              )}
              {(invoice as any).payment.authorization_code && (
                <div className="flex justify-between text-sm">
                  <span>Código de autorización:</span>
                  <span>{(invoice as any).payment.authorization_code}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
          >
            <Printer size={20} className="mr-2" />
            Imprimir
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
          >
            <Download size={20} className="mr-2" />
            Descargar PDF
          </button>
          {invoice.status === 'PAID' && (
            <button
              onClick={() => onCancel(invoice)}
              className="px-4 py-2 text-red-600 hover:text-red-800 flex items-center"
            >
              <Ban size={20} className="mr-2" />
              Anular Factura
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;