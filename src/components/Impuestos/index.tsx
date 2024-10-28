import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import TaxForm from './TaxForm';
import TaxTable from './TaxTable';
import { Tax, TaxFormData } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const initialFormData: TaxFormData = {
  name: '',
  rate: 0,
  description: '',
  applies_to: ''
};

const Impuestos: React.FC = () => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TaxFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('taxes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTaxes(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching taxes:', error);
      setError('Error al cargar los impuestos. Por favor, intente de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rate' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('taxes')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('taxes')
          .insert([formData]);
        
        if (error) throw error;
      }

      await fetchTaxes();
      resetForm();
    } catch (error: any) {
      console.error('Error saving tax:', error);
      setError(error.message || 'Error al guardar el impuesto. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tax: Tax) => {
    setFormData({
      name: tax.name,
      rate: tax.rate,
      description: tax.description,
      applies_to: tax.applies_to
    });
    setEditingId(tax.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este impuesto?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('taxes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchTaxes();
      setError(null);
    } catch (error) {
      console.error('Error deleting tax:', error);
      setError('Error al eliminar el impuesto. Por favor, intente de nuevo.');
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
        <h1 className="text-3xl font-bold">Impuestos</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          <Plus size={20} className="mr-2" />
          Nuevo Impuesto
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
        <TaxForm
          formData={formData}
          onSubmit={handleSubmit}
          onChange={handleInputChange}
          isEditing={!!editingId}
          onCancel={resetForm}
        />
      )}

      {loading && !showForm ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <TaxTable
          taxes={taxes}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default Impuestos;