import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Cliente {
  id: string;
  name: string;
  document: string;
  document_type: 'CEDULA' | 'RNC' | 'PASSPORT';
  phone: string;
  email: string;
  address: string;
}

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Cliente, 'id'>>({
    name: '',
    document: '',
    document_type: 'CEDULA',
    phone: '',
    email: '',
    address: ''
  });
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

      fetchClientes();
      setFormData({
        name: '',
        document: '',
        document_type: 'CEDULA',
        phone: '',
        email: '',
        address: ''
      });
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
      fetchClientes();
      setError(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Error al eliminar el cliente. Por favor, intente de nuevo.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: '',
              document: '',
              document_type: 'CEDULA',
              phone: '',
              email: '',
              address: ''
            });
          }}
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
              />
            </div>
            <div>
              <label className="block mb-2">Tipo de Documento</label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="CEDULA">Cédula</option>
                <option value="RNC">RNC</option>
                <option value="PASSPORT">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Número de Documento</label>
              <input
                type="text"
                name="document"
                value={formData.document}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Dirección</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
            {editingId ? 'Actualizar Cliente' : 'Guardar Cliente'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Documento</th>
              <th className="p-3 text-left">Teléfono</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Dirección</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-t">
                <td className="p-3">{cliente.name}</td>
                <td className="p-3">
                  {cliente.document_type}: {cliente.document}
                </td>
                <td className="p-3">{cliente.phone}</td>
                <td className="p-3">{cliente.email}</td>
                <td className="p-3">{cliente.address}</td>
                <td className="p-3">
                  <button 
                    className="text-blue-500 hover:text-blue-700 mr-2"
                    onClick={() => handleEdit(cliente)}
                  >
                    <Edit size={20} />
                  </button>
                  <button 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(cliente.id)}
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clientes;