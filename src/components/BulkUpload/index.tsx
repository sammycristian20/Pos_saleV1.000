import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, Download, AlertCircle, CheckCircle2, Users, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

type UploadType = 'products' | 'customers';

const BulkUpload: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UploadType>('products');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    let template;
    let filename;

    if (activeTab === 'products') {
      template = [{
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
      }];
      filename = 'plantilla_productos.xlsx';
    } else {
      template = [{
        name: 'Juan Pérez',
        client_type: 'PERSONAL', // PERSONAL o BUSINESS
        document_type: 'CEDULA', // CEDULA, RNC, PASSPORT
        document: '001-0000000-0',
        phone: '809-555-0000',
        email: 'ejemplo@email.com',
        address: 'Calle Principal #123'
      }];
      filename = 'plantilla_clientes.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
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
  };

  const validateCustomer = (customer: any) => {
    if (!customer.name || typeof customer.name !== 'string') {
      throw new Error(`Nombre inválido para el cliente: ${customer.name}`);
    }
    if (!customer.client_type || !['PERSONAL', 'BUSINESS'].includes(customer.client_type)) {
      throw new Error(`Tipo de cliente inválido para: ${customer.name}`);
    }
    if (!customer.document_type || !['CEDULA', 'RNC', 'PASSPORT'].includes(customer.document_type)) {
      throw new Error(`Tipo de documento inválido para: ${customer.name}`);
    }
    if (!customer.document) {
      throw new Error(`Documento requerido para: ${customer.name}`);
    }

    // Validate document format based on type
    if (customer.document_type === 'RNC' && !/^\d{9}$/.test(customer.document)) {
      throw new Error(`Formato de RNC inválido para: ${customer.name}`);
    }
    if (customer.document_type === 'CEDULA' && !/^\d{3}-\d{7}-\d{1}$/.test(customer.document)) {
      throw new Error(`Formato de cédula inválido para: ${customer.name}`);
    }
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
      // Validate all records first
      uploadedData.forEach(activeTab === 'products' ? validateProduct : validateCustomer);

      // Process in batches of 10
      const batchSize = 10;
      const table = activeTab === 'products' ? 'products' : 'customers';
      
      for (let i = 0; i < uploadedData.length; i += batchSize) {
        const batch = uploadedData.slice(i, i + batchSize);
        const { error } = await supabase
          .from(table)
          .insert(batch);

        if (error) throw error;
      }

      setSuccess(`${activeTab === 'products' ? 'Productos' : 'Clientes'} cargados exitosamente`);
      setUploadedData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error processing upload:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar la carga');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: UploadType) => {
    setActiveTab(tab);
    setUploadedData([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Carga Masiva</h1>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => handleTabChange('products')}
              className={`px-6 py-3 font-medium text-sm focus:outline-none ${
                activeTab === 'products'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package size={20} className="inline-block mr-2" />
              Productos
            </button>
            <button
              onClick={() => handleTabChange('customers')}
              className={`px-6 py-3 font-medium text-sm focus:outline-none ${
                activeTab === 'customers'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={20} className="inline-block mr-2" />
              Clientes
            </button>
          </div>
        </div>

        <div className="p-6">
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

          <div className="space-y-6">
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
                        {activeTab === 'products' ? (
                          <>
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2 text-left">Código</th>
                            <th className="p-2 text-right">Precio</th>
                            <th className="p-2 text-right">Stock</th>
                          </>
                        ) : (
                          <>
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2 text-left">Tipo</th>
                            <th className="p-2 text-left">Documento</th>
                            <th className="p-2 text-left">Teléfono</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedData.map((item, index) => (
                        <tr key={index} className="border-t">
                          {activeTab === 'products' ? (
                            <>
                              <td className="p-2">{item.name}</td>
                              <td className="p-2">{item.barcode}</td>
                              <td className="p-2 text-right">${item.price}</td>
                              <td className="p-2 text-right">{item.stock}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-2">{item.name}</td>
                              <td className="p-2">{item.client_type}</td>
                              <td className="p-2">{item.document}</td>
                              <td className="p-2">{item.phone}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <button
                    onClick={processUpload}
                    disabled={loading}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;