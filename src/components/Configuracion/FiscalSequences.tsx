import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface FiscalSequence {
  id: string;
  document_type: string;
  current_prefix: string;
  last_number: number;
  active: boolean;
  created_at: string;
}

const documentTypes = {
  'CREDITO_FISCAL': 'Crédito Fiscal (31)',
  'CONSUMO': 'Consumo (32)',
  'NOTA_DEBITO': 'Nota de Débito (33)',
  'NOTA_CREDITO': 'Nota de Crédito (34)',
  'COMPRAS': 'Compras (41)',
  'GASTOS_MENORES': 'Gastos Menores (43)',
  'REGIMENES_ESPECIALES': 'Regímenes Especiales (44)',
  'GUBERNAMENTAL': 'Gubernamental (45)'
};

const FiscalSequences: React.FC = () => {
  const [sequences, setSequences] = useState<FiscalSequence[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    document_type: '',
    current_prefix: '',
    last_number: 0,
    active: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fiscal_sequences')
        .select('*')
        .order('document_type');

      if (error) throw error;
      setSequences(data || []);
    } catch (err) {
      console.error('Error fetching sequences:', err);
      setError('Error al cargar las secuencias fiscales');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      ...(name === 'document_type' ? { current_prefix: `E${value.slice(0, 2)}` } : {})
    }));
  };

  const validateForm = () => {
    if (!formData.document_type) {
      setError('Debe seleccionar un tipo de documento');
      return false;
    }
    if (!formData.current_prefix.match(/^E\d{2}$/)) {
      setError('El prefijo debe tener el formato E## (ejemplo: E31)');
      return false;
    }
    if (formData.last_number < 0 || formData.last_number > 9999999999) {
      setError('El último número debe estar entre 0 y 9999999999');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('fiscal_sequences')
          .update({
            current_prefix: formData.current_prefix,
            last_number: formData.last_number,
            active: formData.active
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fiscal_sequences')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchSequences();
      resetForm();
    } catch (err: any) {
      console.error('Error saving sequence:', err);
      setError(err.message || 'Error al guardar la secuencia fiscal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sequence: FiscalSequence) => {
    setFormData({
      document_type: sequence.document_type,
      current_prefix: sequence.current_prefix,
      last_number: sequence.last_number,
      active: sequence.active
    });
    setEditingId(sequence.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta secuencia?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('fiscal_sequences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSequences();
    } catch (err) {
      console.error('Error deleting sequence:', err);
      setError('Error al eliminar la secuencia');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      document_type: '',
      current_prefix: '',
      last_number: 0,
      active: true
    });
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Secuencias Fiscales</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          <Plus size={20} className="mr-2" />
          Nueva Secuencia
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Tipo de Comprobante</label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                disabled={loading || !!editingId}
              >
                <option value="">Seleccionar tipo</option>
                {Object.entries(documentTypes).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">Prefijo</label>
              <input
                type="text"
                name="current_prefix"
                value={formData.current_prefix}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                pattern="^E\d{2}$"
                placeholder="E31"
                maxLength={3}
                disabled={loading || !!editingId}
              />
            </div>
            <div>
              <label className="block mb-2">Último Número</label>
              <input
                type="number"
                name="last_number"
                value={formData.last_number}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                min="0"
                max="9999999999"
                disabled={loading}
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  disabled={loading}
                />
                <span>Activo</span>
              </label>
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
                editingId ? 'Actualizar Secuencia' : 'Guardar Secuencia'
              )}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Tipo de Comprobante</th>
              <th className="p-3 text-left">Prefijo</th>
              <th className="p-3 text-left">Último Número</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && !showForm ? (
              <tr>
                <td colSpan={5} className="p-3 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Cargando secuencias...</span>
                  </div>
                </td>
              </tr>
            ) : sequences.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-500">
                  No hay secuencias configuradas
                </td>
              </tr>
            ) : (
              sequences.map((sequence) => (
                <tr key={sequence.id} className="border-t">
                  <td className="p-3">{documentTypes[sequence.document_type as keyof typeof documentTypes]}</td>
                  <td className="p-3">{sequence.current_prefix}</td>
                  <td className="p-3">{sequence.last_number.toString().padStart(10, '0')}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sequence.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sequence.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(sequence)}
                        className="text-blue-500 hover:text-blue-700"
                        disabled={loading}
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(sequence.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={loading}
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
  );
};

export default FiscalSequences;