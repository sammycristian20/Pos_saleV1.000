import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Discount } from '../POS/types';
import DiscountForm from './DiscountForm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const initialFormData: Omit<Discount, 'id'> = {
  name: '',
  type: 'PERCENTAGE',
  value: 0,
  active: true,
  min_purchase_amount: undefined,
  max_discount_amount: undefined,
  start_date: undefined,
  end_date: undefined
};

const Descuentos: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('discounts')
        .select(`
          *,
          product_discounts (
            product:products (
              id,
              name,
              barcode
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setError('Error al cargar los descuentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, selectedProducts: any[]) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let discountId = editingId;

      if (editingId) {
        // Update existing discount
        const { error: updateError } = await supabase
          .from('discounts')
          .update(formData)
          .eq('id', editingId);

        if (updateError) throw updateError;

        // Delete existing product associations
        const { error: deleteError } = await supabase
          .from('product_discounts')
          .delete()
          .eq('discount_id', editingId);

        if (deleteError) throw deleteError;
      } else {
        // Create new discount
        const { data, error } = await supabase
          .from('discounts')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        discountId = data.id;
      }

      // Insert new product associations if there are selected products
      if (selectedProducts.length > 0) {
        const productDiscounts = selectedProducts.map(product => ({
          discount_id: discountId,
          product_id: product.id
        }));

        const { error: productError } = await supabase
          .from('product_discounts')
          .insert(productDiscounts);

        if (productError) throw productError;
      }

      await fetchDiscounts();
      resetForm();
    } catch (err) {
      console.error('Error saving discount:', err);
      setError('Error al guardar el descuento');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (discount: Discount) => {
    setFormData({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      active: discount.active,
      min_purchase_amount: discount.min_purchase_amount,
      max_discount_amount: discount.max_discount_amount,
      start_date: discount.start_date,
      end_date: discount.end_date
    });
    setEditingId(discount.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este descuento?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchDiscounts();
    } catch (err) {
      console.error('Error deleting discount:', err);
      setError('Error al eliminar el descuento');
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
        <h1 className="text-3xl font-bold">Descuentos</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          <Plus size={20} className="mr-2" />
          Nuevo Descuento
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
        <DiscountForm
          formData={formData}
          onSubmit={handleSubmit}
          onChange={setFormData}
          isEditing={!!editingId}
          onCancel={resetForm}
          loading={loading}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Valor</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Vigencia</th>
              <th className="p-3 text-left">Productos</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && !showForm ? (
              <tr>
                <td colSpan={7} className="p-3 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Cargando descuentos...</span>
                  </div>
                </td>
              </tr>
            ) : discounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-3 text-center text-gray-500">
                  No hay descuentos configurados
                </td>
              </tr>
            ) : (
              discounts.map((discount) => (
                <tr key={discount.id} className="border-t">
                  <td className="p-3">{discount.name}</td>
                  <td className="p-3">
                    {discount.type === 'PERCENTAGE' ? 'Porcentaje' : 'Monto Fijo'}
                  </td>
                  <td className="p-3">
                    {discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value}`}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      discount.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {discount.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-3">
                    {discount.start_date && discount.end_date ? (
                      <span className="text-sm">
                        {new Date(discount.start_date).toLocaleDateString()} -
                        {new Date(discount.end_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Sin límite</span>
                    )}
                  </td>
                  <td className="p-3">
                    {(discount as any).product_discounts?.length > 0 ? (
                      <div className="text-sm">
                        {(discount as any).product_discounts.length} productos
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Todos los productos</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="text-blue-500 hover:text-blue-700"
                        disabled={loading}
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id)}
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

export default Descuentos;