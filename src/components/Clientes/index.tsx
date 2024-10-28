import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ClienteForm from './ClienteForm';
import ClienteTable from './ClienteTable';
import { Cliente, ClienteFormData } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const initialFormData: ClienteFormData = {
  name: '',
  document: '',
  document_type: 'CEDULA',
  phone: '',
  email: '',
  address: ''
};

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ClienteFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setClientes(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Error al cargar los clientes. Por favor, intente de nuevo más tarde.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData]);
        
        if (error) throw error;
      }

      await fetchClientes();
      setFormData(initialFormData);
      setShowForm(false);
      setEditingId(null);
      setError(null);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setError(error.message || 'Error al guardar el cliente. Por favor, intente de nuevo.');
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      name: cliente.name,
      document: cliente.document,
      document_type: cliente.document_type,
      phone: cliente.phone || '',
      email: cliente.email || '',
      address: cliente.address || ''
    });
    setEditingId(cliente.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este cliente?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchClientes();
      setError(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Error al eliminar el cliente. Por favor, intente de nuevo.');
    }
  };

  const resetForm = () => {
    setShowForm(!showForm);
    setEditingId(null);
    setFormData(initialFormData);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          onClick={resetForm}
        >
          <Plus size={20} className="mr-2" />
          Nuevo Cliente
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {showForm && (
        <ClienteForm
          formData={formData}
          onSubmit={handleSubmit}
          onChange={handleInputChange}
          isEditing={!!editingId}
        />
      )}

      <ClienteTable
        clientes={clientes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Clientes;