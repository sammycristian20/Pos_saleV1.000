import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { ClienteTableProps } from './types';

const ClienteTable: React.FC<ClienteTableProps> = ({ clientes, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Nombre</th>
            <th className="p-3 text-left">Documento</th>
            <th className="p-3 text-left">Teléfono</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Dirección</th>
            <th className="p-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id} className="border-t">
              <td className="p-3">{cliente.name}</td>
              <td className="p-3">
                {cliente.document_type}: {cliente.document}
              </td>
              <td className="p-3">{cliente.phone}</td>
              <td className="p-3">{cliente.email}</td>
              <td className="p-3">{cliente.address}</td>
              <td className="p-3">
                <button 
                  className="text-blue-500 hover:text-blue-700 mr-2"
                  onClick={() => onEdit(cliente)}
                >
                  <Edit size={20} />
                </button>
                <button 
                  className="text-red-500 hover:text-red-700"
                  onClick={() => onDelete(cliente.id)}
                >
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClienteTable;