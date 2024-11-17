import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatDate, formatCurrency } from '../../utils/format';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface InventoryEntry {
  id: string;
  product: {
    name: string;
    barcode: string;
  };
  entry_type: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'DEFECT';
  quantity: number;
  notes: string | null;
  created_at: string;
}

const InventoryList: React.FC = () => {
  const [entries, setEntries] = React.useState<InventoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_entries')
        .select(`
          id,
          entry_type,
          quantity,
          notes,
          created_at,
          product:products (
            name,
            barcode
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching inventory entries:', err);
      setError('Error al cargar los movimientos de inventario');
    } finally {
      setLoading(false);
    }
  };

  const getEntryTypeLabel = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return 'Entrada';
      case 'RETURN':
        return 'Devolución';
      case 'ADJUSTMENT':
        return 'Ajuste';
      case 'DEFECT':
        return 'Defecto';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay movimientos registrados
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">Fecha</th>
            <th className="px-4 py-2 text-left">Producto</th>
            <th className="px-4 py-2 text-left">Tipo</th>
            <th className="px-4 py-2 text-right">Cantidad</th>
            <th className="px-4 py-2 text-left">Notas</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t">
              <td className="px-4 py-2">
                {formatDate(entry.created_at)}
              </td>
              <td className="px-4 py-2">
                <div>
                  <p className="font-medium">{entry.product.name}</p>
                  <p className="text-sm text-gray-500">{entry.product.barcode}</p>
                </div>
              </td>
              <td className="px-4 py-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  entry.entry_type === 'PURCHASE'
                    ? 'bg-green-100 text-green-800'
                    : entry.entry_type === 'DEFECT'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {getEntryTypeLabel(entry.entry_type)}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                <span className={entry.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                  {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                </span>
              </td>
              <td className="px-4 py-2">
                {entry.notes || <span className="text-gray-400">-</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryList;