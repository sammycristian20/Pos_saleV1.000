import React from 'react';
import { TaxFormProps } from './types';

const TaxForm: React.FC<TaxFormProps> = ({ formData, onSubmit, onChange, isEditing, onCancel }) => {
  return (
    <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">Tasa (%)</label>
          <input
            type="number"
            name="rate"
            value={formData.rate}
            onChange={onChange}
            className="w-full p-2 border rounded"
            min="0"
            max="100"
            step="0.01"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block mb-2">Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
        <div>
          <label className="block mb-2">Se aplica a</label>
          <input
            type="text"
            name="applies_to"
            value={formData.applies_to}
            onChange={onChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          {isEditing ? 'Actualizar Impuesto' : 'Guardar Impuesto'}
        </button>
      </div>
    </form>
  );
};

export default TaxForm;