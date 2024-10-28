import React, { useState } from 'react';
import Barcode from 'react-barcode';
import { Printer, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
}

interface BarcodePrintingProps {
  products: Product[];
  onClose: () => void;
}

const BarcodePrinting: React.FC<BarcodePrintingProps> = ({ products, onClose }) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleProductSelection = (product: Product) => {
    if (isPrinting) return;
    
    setSelectedProducts(prevSelected =>
      prevSelected.some(p => p.id === product.id)
        ? prevSelected.filter(p => p.id !== product.id)
        : [...prevSelected, product]
    );
  };

  const printBarcodes = () => {
    try {
      setError(null);
      setIsPrinting(true);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresión');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Códigos de Barras</title>
          <style>
            @page { margin: 0.5cm; }
            @media print {
              body { margin: 0; }
            }
            body { 
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
            }
            .barcode-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 10px;
              padding: 10px;
            }
            .barcode-container { 
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 10px;
              border: 1px solid #eee;
              page-break-inside: avoid;
              background: white;
            }
            .product-info { 
              margin-top: 5px;
              text-align: center;
              font-size: 12px;
              line-height: 1.2;
            }
            .product-name {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .product-price {
              color: #2563eb;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="barcode-grid">
      `);

      selectedProducts.forEach(product => {
        if (product.barcode) {
          printWindow.document.write(`
            <div class="barcode-container">
              ${Barcode.getTSV(product.barcode)}
              <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
              </div>
            </div>
          `);
        }
      });

      printWindow.document.write(`
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();

      // Add event listeners for print window
      printWindow.onafterprint = () => {
        printWindow.close();
        setIsPrinting(false);
        onClose();
      };

      printWindow.onbeforeunload = () => {
        setIsPrinting(false);
        onClose();
      };

      // Handle print errors
      printWindow.onerror = (msg) => {
        setError(`Error al imprimir: ${msg}`);
        setIsPrinting(false);
        printWindow.close();
      };

      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al preparar la impresión');
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-3/4 max-h-[80vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Imprimir Códigos de Barras</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            aria-label="Cerrar"
            disabled={isPrinting}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            product.barcode && (
              <div
                key={product.id}
                className={`
                  p-4 border rounded cursor-pointer transition-all duration-200
                  ${selectedProducts.some(p => p.id === product.id) 
                    ? 'bg-blue-100 border-blue-500 shadow-md' 
                    : 'hover:bg-gray-50 hover:border-gray-300'}
                  ${isPrinting ? 'pointer-events-none opacity-50' : ''}
                `}
                onClick={() => toggleProductSelection(product)}
              >
                <Barcode 
                  value={product.barcode} 
                  width={1.5} 
                  height={50} 
                  fontSize={12}
                  displayValue={true}
                  margin={5}
                />
                <p className="mt-2 text-sm font-semibold truncate">{product.name}</p>
                <p className="text-sm font-bold text-blue-600">${product.price.toFixed(2)}</p>
              </div>
            )
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''} seleccionado{selectedProducts.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={printBarcodes}
            disabled={selectedProducts.length === 0 || isPrinting}
            className={`
              flex items-center px-4 py-2 rounded transition-all duration-200
              ${selectedProducts.length > 0 && !isPrinting
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            <Printer size={20} className="mr-2" />
            {isPrinting ? 'Imprimiendo...' : 'Imprimir Seleccionados'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodePrinting;