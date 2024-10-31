import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { ClienteTableProps } from './types';

const ClienteTable: React.FC<ClienteTableProps> = ({ 
  clientes, 
  onEdit, 
  onDelete,
  isLoading 
}) => {
  const getClientTypeLabel = (type: string) => {
    return type === 'PERSONAL' ? 'Persona Física' : 'Empresa';
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'CEDULA':
        return 'Cédula';
      case 'RNC':
        return 'RNC';
      case 'PASSPORT':
        return 'Pasaporte';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Cargando clientes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Nombre</th>
            <th className="p-3 text-left">Tipo</th>
            <th className="p-3 text-left">Documento</th>
            <th className="p-3 text-left">Teléfono</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Dirección</th>
            <th className="p-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-3 text-center text-gray-500">
                No hay clientes registrados
              </td>
            </tr>
          ) : (
            clientes.map((cliente) => (
              <tr key={cliente.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{cliente.name}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cliente.client_type === 'PERSONAL' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {getClientTypeLabel(cliente.client_type)}
                  </span>
                </td>
                <td className="p-3">
                  <div>
                    <span className="text-sm text-gray-500">
                      {getDocumentTypeLabel(cliente.document_type)}:
                    </span>
                    <br />
                    {cliente.document}
                  </div>
                </td>
                <td className="p-3">{cliente.phone}</td>
                <td className="p-3">{cliente.email}</td>
                <td className="p-3">{cliente.address}</td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button 
                      className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                      onClick={() => onEdit(cliente)}
                      disabled={isLoading}
                      title="Editar cliente"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      onClick={() => onDelete(cliente.id)}
                      disabled={isLoading}
                      title="Eliminar cliente"
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
  );
};

export default ClienteTable;