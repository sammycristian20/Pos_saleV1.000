import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ClienteForm from './ClienteForm';
import ClienteTable from './ClienteTable';
import { Cliente, ClienteFormData } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const initialFormData: ClienteFormData = {
  name: '',
  client_type: 'PERSONAL',
  document_type: 'CEDULA',
  document: '',
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClientes(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Error al cargar los clientes. Por favor, intente de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Reset document type when client type changes
      if (name === 'client_type') {
        newData.document_type = value === 'BUSINESS' ? 'RNC' : 'CEDULA';
        newData.document = '';
      }

      return newData;
    });
  };

  const validateDocument = (document: string, documentType: string): boolean => {
    switch (documentType) {
      case 'RNC':
        return /^[0-9]{9}$/.test(document);
      case 'CEDULA':
        return /^\d{3}-\d{7}-\d{1}$/.test(document);
      case 'PASSPORT':
        return document.length >= 6;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!validateDocument(formData.document, formData.document_type)) {
        throw new Error('El formato del documento no es válido');
      }

      if (editingId) {
        const { error } = await supabase
          .from('customers')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      name: cliente.name,
      client_type: cliente.client_type,
      document_type: cliente.document_type,
      document: cliente.document,
      phone: cliente.phone || '',
      email: cliente.email || '',
      address: cliente.address || ''
    });
    setEditingId(cliente.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este cliente?')) return;

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center hover:bg-blue-600 disabled:bg-blue-300"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData(initialFormData);
          }}
          disabled={isLoading}
        >
          <Plus size={20} className="mr-2" />
          Nuevo Cliente
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
        <ClienteForm
          formData={formData}
          onSubmit={handleSubmit}
          onChange={handleInputChange}
          isEditing={!!editingId}
          isLoading={isLoading}
        />
      )}

      <ClienteTable
        clientes={clientes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Clientes;