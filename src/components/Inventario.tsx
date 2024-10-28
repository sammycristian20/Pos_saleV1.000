import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Printer } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import BarcodePrinting from './BarcodePrinting';
import { formatCurrency } from '../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Producto {
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
  discounts?: {
    id: string;
    discount: {
      id: string;
      name: string;
      type: 'PERCENTAGE' | 'FIXED';
      value: number;
    };
  }[];
}

const Inventario: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; name: string; }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showBarcodePrinting, setShowBarcodePrinting] = useState(false);
  const [formData, setFormData] = useState<Omit<Producto, 'id'>>({
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

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
  }, []);

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
          discounts:product_discounts (
            id,
            discount:discounts (
              id,
              name,
              type,
              value
            )
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

  const handleEdit = (producto: Producto) => {
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
            {editingId ? 'Editar Producto' : 'Nuevo Producto'}
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center"
            onClick={() => setShowBarcodePrinting(true)}
            disabled={loading}
          >
            <Printer size={20} className="mr-2" />
            Imprimir Códigos de Barras
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !showForm ? (
          <div className="col-span-full flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Cargando productos...</span>
          </div>
        ) : productos.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No hay productos registrados
          </div>
        ) : (
          productos.map((producto) => (
            <div key={producto.id} className="bg-white p-6 rounded-lg shadow-md">
              {producto.photos && producto.photos.length > 0 && (
                <img 
                  src={producto.photos[0].photo_url}
                  alt={producto.name}
                  className="w-full h-48 object-cover mb-4 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
              )}
              <h3 className="text-xl font-bold mb-2">{producto.name}</h3>
              <p className="text-gray-600 mb-2">Código: {producto.barcode}</p>
              <p className="text-gray-600 mb-2">Precio: {formatCurrency(producto.price)}</p>
              <p className="text-gray-600 mb-2">Stock: {producto.stock}</p>
              <p className="text-gray-600 mb-4">
                Categoría: {(producto as any).categories?.name || 'N/A'}
              </p>
              <div className="flex justify-end">
                <button 
                  className="text-blue-500 hover:text-blue-700 mr-2"
                  onClick={() => handleEdit(producto)}
                  disabled={loading}
                >
                  <Edit size={20} />
                </button>
                <button 
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(producto.id)}
                  disabled={loading}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showBarcodePrinting && (
        <BarcodePrinting
          products={productos}
          onClose={() => setShowBarcodePrinting(false)}
        />
      )}
    </div>
  );
};

export default Inventario;