import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { TaxTableProps } from './types';

const TaxTable: React.FC<TaxTableProps> = ({ taxes, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Nombre</th>
            <th className="p-3 text-left">Tasa</th>
            <th className="p-3 text-left">Descripción</th>
            <th className="p-3 text-left">Se aplica a</th>
            <th className="p-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {taxes.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-3 text-center text-gray-500">
                No hay impuestos configurados
              </td>
            </tr>
          ) : (
            taxes.map((tax) => (
              <tr key={tax.id} className="border-t">
                <td className="p-3">{tax.name}</td>
                <td className="p-3">{tax.rate}%</td>
                <td className="p-3">{tax.description}</td>
                <td className="p-3">{tax.applies_to}</td>
                <td className="p-3">
                  <button 
                    className="text-blue-500 hover:text-blue-700 mr-2"
                    onClick={() => onEdit(tax)}
                  >
                    <Edit size={20} />
                  </button>
                  <button 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => onDelete(tax.id)}
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaxTable;