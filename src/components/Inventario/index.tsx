import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, Printer, Eye, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import BulkUpload from './BulkUpload';
import BarcodePrinting from '../BarcodePrinting';
import ProductModal from './ProductModal';
import { formatCurrency } from '../../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category_id: string;
  photos?: {
    id: string;
    photo_url: string;
    is_primary: boolean;
  }[];
  categories?: {
    name: string;
  };
}

const Inventario: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; name: string; }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showBarcodePrinting, setShowBarcodePrinting] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    barcode: '',
    price: 0,
    stock: 0,
    category_id: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
    
    if (searchParams.get('action') === 'bulk-upload') {
      setShowBulkUpload(true);
    }
  }, [searchParams]);

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          photos:product_photos (
            id,
            photo_url,
            is_primary
          ),
          categories (
            name
          )
        `)
        .order('name');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Error al cargar las categorías');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let productData = { ...formData };

      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { data: productResult, error: productError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (productError) throw productError;

        if (imageFile && productResult) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${productResult.id}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('product_photos')
            .upload(fileName, imageFile);

          if (uploadError) throw uploadError;

          const { data: photoData } = supabase.storage
            .from('product_photos')
            .getPublicUrl(fileName);

          const { error: photoError } = await supabase
            .from('product_photos')
            .insert([{
              product_id: productResult.id,
              photo_url: photoData.publicUrl,
              is_primary: true
            }]);

          if (photoError) throw photoError;
        }
      }

      await fetchProductos();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (producto: Product) => {
    setFormData({
      name: producto.name,
      barcode: producto.barcode,
      price: producto.price,
      stock: producto.stock,
      category_id: producto.category_id,
    });
    setEditingId(producto.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProductos();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Error al eliminar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no debe superar los 2MB');
        return;
      }
      setImageFile(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      barcode: '',
      price: 0,
      stock: 0,
      category_id: '',
    });
    setShowForm(false);
    setEditingId(null);
    setImageFile(null);
    setError(null);
  };

  const filteredProducts = productos.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
          >
            <Plus size={20} className="mr-2" />
            Nuevo Producto
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center"
            onClick={() => setShowBarcodePrinting(true)}
            disabled={loading}
          >
            <Printer size={20} className="mr-2" />
            Imprimir Códigos
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Nombre</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block mb-2">Código de Barras</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block mb-2">Precio</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block mb-2">Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block mb-2">Categoría</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                disabled={loading}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 border rounded"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-green-300"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingId ? 'Actualizando...' : 'Guardando...'}
                </span>
              ) : (
                editingId ? 'Actualizar Producto' : 'Guardar Producto'
              )}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              placeholder="Buscar productos por nombre o código..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Cargando productos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.categories?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Ver detalles"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-yellow-500 hover:text-yellow-700"
                          title="Editar"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBarcodePrinting && (
        <BarcodePrinting
          products={productos}
          onClose={() => setShowBarcodePrinting(false)}
        />
      )}

      {showBulkUpload && (
        <BulkUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={fetchProductos}
        />
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Inventario;