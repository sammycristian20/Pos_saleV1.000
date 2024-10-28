import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface CuentaPorPagar {
  id: number;
  proveedor: string;
  monto: number;
  fechaVencimiento: string;
  estado: 'Pendiente' | 'Pagada';
}

const CuentasPorPagar: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaPorPagar[]>([
    { id: 1, proveedor: 'Proveedor A', monto: 1000, fechaVencimiento: '2024-04-15', estado: 'Pendiente' },
    { id: 2, proveedor: 'Proveedor B', monto: 1500, fechaVencimiento: '2024-04-30', estado: 'Pendiente' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<CuentaPorPagar, 'id'>>({
    proveedor: '',
    monto: 0,
    fechaVencimiento: '',
    estado: 'Pendiente',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'monto' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.proveedor && formData.monto && formData.fechaVencimiento) {
      setCuentas([...cuentas, { ...formData, id: Date.now() }]);
      setFormData({ proveedor: '', monto: 0, fechaVencimiento: '', estado: 'Pendiente' });
      setShowForm(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cuentas por Pagar</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={20} className="mr-2" />
          Nueva Cuenta
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Proveedor</label>
              <input
                type="text"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Monto</label>
              <input
                type="number"
                name="monto"
                value={formData.monto}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Fecha de Vencimiento</label>
              <input
                type="date"
                name="fechaVencimiento"
                value={formData.fechaVencimiento}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pagada">Pagada</option>
              </select>
            </div>
          </div>
          <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
            Guardar Cuenta
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Proveedor</th>
              <th className="p-3 text-left">Monto</th>
              <th className="p-3 text-left">Fecha de Vencimiento</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((cuenta) => (
              <tr key={cuenta.id} className="border-t">
                <td className="p-3">{cuenta.proveedor}</td>
                <td className="p-3">${cuenta.monto.toFixed(2)}</td>
                <td className="p-3">{cuenta.fechaVencimiento}</td>
                <td className="p-3">{cuenta.estado}</td>
                <td className="p-3">
                  <button className="text-blue-500 hover:text-blue-700 mr-2">
                    <Edit size={20} />
                  </button>
                  <button className="text-red-500 hover:text-red-700">
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

export default CuentasPorPagar;