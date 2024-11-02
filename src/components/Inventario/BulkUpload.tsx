import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, Download, AlertCircle, CheckCircle2, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface BulkUploadProps {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Ejemplo Producto',
        description: 'Descripción del producto',
        barcode: 'ABC123',
        sku: 'SKU123',
        price: 100.00,
        cost: 80.00,
        stock: 10,
        min_stock: 5,
        category_id: 'ID de la categoría',
        tax_rate: 0.18,
        brand: 'Marca',
        unit_measure: 'unidad'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setUploadedData(jsonData);
        setError(null);
        setSuccess('Archivo cargado correctamente. Verifique los datos antes de procesar.');
      } catch (err) {
        setError('Error al procesar el archivo. Asegúrese de que sea un archivo Excel válido.');
        setUploadedData([]);
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo.');
      setUploadedData([]);
    };

    reader.readAsBinaryString(file);
  };

  const validateProduct = (product: any) => {
    if (!product.name || typeof product.name !== 'string') {
      throw new Error(`Nombre inválido para el producto: ${product.name}`);
    }
    if (!product.price || isNaN(product.price)) {
      throw new Error(`Precio inválido para el producto: ${product.name}`);
    }
    if (typeof product.stock !== 'number' || product.stock < 0) {
      throw new Error(`Stock inválido para el producto: ${product.name}`);
    }
    // Add more validations as needed
  };

  const processUpload = async () => {
    if (uploadedData.length === 0) {
      setError('No hay datos para procesar');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate all products first
      uploadedData.forEach(validateProduct);

      // Process in batches of 10
      const batchSize = 10;
      for (let i = 0; i < uploadedData.length; i += batchSize) {
        const batch = uploadedData.slice(i, i + batchSize);
        const { error } = await supabase
          .from('products')
          .insert(batch);

        if (error) throw error;
      }

      setSuccess('Productos cargados exitosamente');
      await onSuccess();
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('Error processing upload:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar la carga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Carga Masiva de Productos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md">
            <div className="flex items-center">
              <CheckCircle2 className="mr-2" />
              <p>{success}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <button
              onClick={downloadTemplate}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              <Download size={20} className="mr-2" />
              Descargar Plantilla
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
              disabled={loading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <Upload size={20} className="mr-2" />
              Seleccionar Archivo Excel
            </button>
          </div>

          {uploadedData.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Vista Previa:</h3>
              <div className="max-h-60 overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-left">Código</th>
                      <th className="p-2 text-right">Precio</th>
                      <th className="p-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.map((product, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{product.name}</td>
                        <td className="p-2">{product.barcode}</td>
                        <td className="p-2 text-right">${product.price}</td>
                        <td className="p-2 text-right">{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={processUpload}
              disabled={loading || uploadedData.length === 0}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-green-300"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                'Procesar Carga'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;