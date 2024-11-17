import React from 'react';
import type { SellerFormProps } from './types';

const SellerForm: React.FC<SellerFormProps> = ({
  formData,
  onSubmit,
  onChange,
  isEditing,
  onCancel,
  loading
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            pattern="\d{3}-\d{3}-\d{4}"
            placeholder="809-555-5555"
            title="Formato: 809-555-5555"
            required
            disabled={loading}
          />
        </div>

        <div className="col-span-2">
          <label className="block mb-2 font-medium text-gray-700">Dirección</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Fecha de Nacimiento</label>
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Fecha de Ingreso</label>
          <input
            type="date"
            name="hire_date"
            value={formData.hire_date}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Salario</label>
          <input
            type="number"
            name="salary"
            value={formData.salary}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.01"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Tipo de Contrato</label>
          <select
            name="contract_type"
            value={formData.contract_type}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          >
            <option value="FULL_TIME">Tiempo Completo</option>
            <option value="PART_TIME">Medio Tiempo</option>
            <option value="CONTRACTOR">Contratista</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block mb-2 font-medium text-gray-700">URL de la Foto</label>
          <input
            type="url"
            name="photo_url"
            value={formData.photo_url || ''}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://ejemplo.com/foto.jpg"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
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
              {isEditing ? 'Actualizando...' : 'Guardando...'}
            </span>
          ) : (
            isEditing ? 'Actualizar Vendedor' : 'Guardar Vendedor'
          )}
        </button>
      </div>
    </form>
  );
};

export default SellerForm;