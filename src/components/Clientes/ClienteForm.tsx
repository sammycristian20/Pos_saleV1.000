import React from 'react';
import { ClienteFormProps } from './types';

const ClienteForm: React.FC<ClienteFormProps> = ({ formData, onSubmit, onChange, isEditing }) => {
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
          <label className="block mb-2">Tipo de Documento</label>
          <select
            name="document_type"
            value={formData.document_type}
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-2">Dirección</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
        {isEditing ? 'Actualizar Cliente' : 'Guardar Cliente'}
      </button>
    </form>
  );
};

export default ClienteForm;