import React, { useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';

interface ReceiptModalProps {
  invoice: any;
  onClose: () => void;
  autoPrint?: boolean;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, onClose, autoPrint = false }) => {
  useEffect(() => {
    if (autoPrint) {
      handlePrint();
    }
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor, permita las ventanas emergentes para imprimir el recibo.');
      return;
    }

    const styles = `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
      body {
        width: 80mm;
        margin: 0;
        padding: 5mm;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.2;
      }
      .header {
        text-align: center;
        margin-bottom: 10px;
      }
      .company-name {
        font-size: 16px;
        font-weight: bold;
      }
      .divider {
        border-top: 1px dashed #000;
        margin: 5px 0;
      }
      .item {
        margin: 5px 0;
      }
      .item-details {
        display: flex;
        justify-content: space-between;
      }
      .totals {
        margin-top: 10px;
      }
      .total-line {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        margin-top: 10px;
        font-size: 10px;
      }
    `;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Recibo de Venta</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Mi Empresa</div>
            <div>RNC: 123456789</div>
            <div>Dirección de la Empresa</div>
            <div>Tel: (809) 555-1234</div>
          </div>
          
          <div class="divider"></div>
          
          <div>
            <div>NCF: ${invoice.fiscal_number || 'N/A'}</div>
            <div>Fecha: ${formatDate(invoice.created_at)}</div>
            ${invoice.customer ? `
              <div>Cliente: ${invoice.customer.name}</div>
              <div>${invoice.customer.document_type}: ${invoice.customer.document}</div>
            ` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div>
            ${invoice.items.map((item: any) => `
              <div class="item">
                <div>${item.product.name}</div>
                <div class="item-details">
                  <span>${item.quantity} x ${formatCurrency(item.unit_price)}</span>
                  <span>${formatCurrency(item.total)}</span>
                </div>
                ${item.discount_amount > 0 ? `
                  <div class="item-details">
                    <span>Descuento</span>
                    <span>-${formatCurrency(item.discount_amount)}</span>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.discount_amount > 0 ? `
              <div class="total-line">
                <span>Descuento:</span>
                <span>-${formatCurrency(invoice.discount_amount)}</span>
              </div>
            ` : ''}
            <div class="total-line">
              <span>ITBIS (18%):</span>
              <span>${formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div class="total-line" style="font-size: 14px;">
              <span>TOTAL:</span>
              <span>${formatCurrency(invoice.total_amount)}</span>
            </div>
            ${invoice.payment?.payment_method === 'CASH' ? `
              <div class="total-line">
                <span>Efectivo:</span>
                <span>${formatCurrency(invoice.payment.amount_tendered)}</span>
              </div>
              <div class="total-line">
                <span>Cambio:</span>
                <span>${formatCurrency(invoice.payment.change_amount)}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>¡Gracias por su compra!</p>
            <p>Conserve este recibo para cualquier reclamación</p>
            ${invoice.payment?.payment_method === 'CARD' ? `
              <p>Autorización: ${invoice.payment.authorization_code || 'N/A'}</p>
              <p>Referencia: ${invoice.payment.reference_number || 'N/A'}</p>
            ` : ''}
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Venta Completada</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-center">
              La venta se ha procesado correctamente
            </p>
            {invoice.fiscal_number && (
              <p className="text-center mt-2">
                <span className="font-medium">NCF:</span> {invoice.fiscal_number}
              </p>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <Printer className="mr-2" size={20} />
            Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;