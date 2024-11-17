import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import type { Seller } from './types';
import SellerForm from './SellerForm';
import SellerTable from './SellerTable';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const initialFormData = {
  name: '',
  phone: '',
  address: '',
  hire_date: new Date().toISOString().split('T')[0],
  salary: 0,
  contract_type: 'FULL_TIME' as const,
  birth_date: '',
  email: '',
  photo_url: ''
};

const Vendedores: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSellers(data || []);
    } catch (err) {
      console.error('Error fetching sellers:', err);
      setError('Error al cargar los vendedores');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('sellers')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sellers')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchSellers();
      resetForm();
    } catch (err) {
      console.error('Error saving seller:', err);
      setError('Error al guardar el vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (seller: Seller) => {
    setFormData({
      name: seller.name,
      phone: seller.phone,
      address: seller.address,
      hire_date: seller.hire_date,
      salary: seller.salary,
      contract_type: seller.contract_type,
      birth_date: seller.birth_date,
      email: seller.email || '',
      photo_url: seller.photo_url || ''
    });
    setEditingId(seller.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este vendedor?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sellers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSellers();
    } catch (err) {
      console.error('Error deleting seller:', err);
      setError('Error al eliminar el vendedor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vendedores</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          <Plus size={20} className="mr-2" />
          Nuevo Vendedor
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {showForm && (
        <SellerForm
          formData={formData}
          onSubmit={handleSubmit}
          onChange={handleInputChange}
          isEditing={!!editingId}
          onCancel={resetForm}
          loading={loading}
        />
      )}

      <SellerTable
        sellers={sellers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />
    </div>
  );
};

export default Vendedores;