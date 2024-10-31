import React from 'react';
import { ClienteFormProps, DocumentType } from './types';

const ClienteForm: React.FC<ClienteFormProps> = ({ 
  formData, 
  onSubmit, 
  onChange, 
  isEditing,
  isLoading 
}) => {
  const allowedDocumentTypes: { [key: string]: DocumentType[] } = {
    PERSONAL: ['CEDULA', 'PASSPORT'],
    BUSINESS: ['RNC']
  };

  const documentLabels: { [key in DocumentType]: string } = {
    CEDULA: 'Cédula',
    RNC: 'RNC',
    PASSPORT: 'Pasaporte'
  };

  const getDocumentPattern = (type: DocumentType): string | undefined => {
    switch (type) {
      case 'RNC':
        return '^[0-9]{9}$';
      case 'CEDULA':
        return '^\\d{3}-\\d{7}-\\d{1}$';
      default:
        return undefined;
    }
  };

  const getDocumentTitle = (type: DocumentType): string => {
    switch (type) {
      case 'RNC':
        return 'El RNC debe tener 9 dígitos';
      case 'CEDULA':
        return 'Formato: 000-0000000-0';
      case 'PASSPORT':
        return 'Mínimo 6 caracteres';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
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
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Tipo de Cliente</label>
          <select
            name="client_type"
            value={formData.client_type}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isLoading}
          >
            <option value="">Seleccionar tipo</option>
            <option value="PERSONAL">Persona Física</option>
            <option value="BUSINESS">Empresa</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Tipo de Documento</label>
          <select
            name="document_type"
            value={formData.document_type}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isLoading}
          >
            <option value="">Seleccionar documento</option>
            {formData.client_type && allowedDocumentTypes[formData.client_type].map((type) => (
              <option key={type} value={type}>
                {documentLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Número de Documento</label>
          <input
            type="text"
            name="document"
            value={formData.document}
            onChange={onChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            pattern={getDocumentPattern(formData.document_type)}
            title={getDocumentTitle(formData.document_type)}
            disabled={isLoading}
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
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
            placeholder="809-555-5555"
            title="Formato: 809-555-5555"
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditing ? 'Actualizando...' : 'Guardando...'}
            </span>
          ) : (
            isEditing ? 'Actualizar Cliente' : 'Guardar Cliente'
          )}
        </button>
      </div>
    </form>
  );
};

export default ClienteForm;