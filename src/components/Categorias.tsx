import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_BUCKET = 'categories';

interface Categoria {
  id: string;
  name: string;
  description: string;
  image_url?: string;
}

const Categorias: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Categoria, 'id'>>({
    name: '',
    description: '',
    image_url: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Get public URLs for all images
      const categoriasWithImages = await Promise.all(
        (data || []).map(async (categoria) => {
          if (categoria.image_url) {
            const { data: { publicUrl } } = supabase
              .storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(categoria.image_url);
            return { ...categoria, image_url: publicUrl };
          }
          return categoria;
        })
      );
      
      setCategorias(categoriasWithImages);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsLoading(true);
    try {
      let image_path = formData.image_url;

      if (imageFile) {
        // Create a unique file name
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        // Upload the image
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        image_path = fileName;
      }

      const categoryData = {
        ...formData,
        image_url: image_path
      };

      if (editingId) {
        // If updating and there's a new image, delete the old one
        if (imageFile && formData.image_url) {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([formData.image_url]);
        }

        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);
          
        if (error) throw error;
      }

      await fetchCategorias();
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setFormData({
      name: categoria.name,
      description: categoria.description,
      image_url: categoria.image_url || ''
    });
    setEditingId(categoria.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number, imageUrl?: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta categoría?')) return;

    setIsLoading(true);
    try {
      // Delete the image from storage if it exists
      if (imageUrl) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([imageUrl]);
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      await fetchCategorias();
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('La imagen no debe superar los 2MB');
        return;
      }
      setImageFile(file);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', image_url: '' });
    setShowForm(false);
    setEditingId(null);
    setImageFile(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Categorías</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowForm(!showForm)}
          disabled={isLoading}
        >
          <Plus size={20} className="mr-2" />
          {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
        </button>
      </div>

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
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block mb-2">Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block mb-2">Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 border rounded"
                disabled={isLoading}
              />
              {formData.image_url && (
                <p className="text-sm text-gray-500 mt-1">
                  Imagen actual: {formData.image_url.split('/').pop()}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-green-300"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : editingId ? 'Actualizar Categoría' : 'Guardar Categoría'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="bg-white p-6 rounded-lg shadow-md">
            {categoria.image_url && (
              <div className="relative h-48 mb-4">
                <img
                  src={categoria.image_url}
                  alt={categoria.name}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
              </div>
            )}
            <h3 className="text-xl font-bold mb-2">{categoria.name}</h3>
            <p className="text-gray-600 mb-4">{categoria.description}</p>
            <div className="flex justify-end">
              <button
                className="text-blue-500 hover:text-blue-700 mr-2"
                onClick={() => handleEdit(categoria)}
                disabled={isLoading}
              >
                <Edit size={20} />
              </button>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => handleDelete(categoria.id, categoria.image_url)}
                disabled={isLoading}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categorias;