import React from 'react';
import { Edit, Trash2, User } from 'lucide-react';
import type { Seller } from './types';
import { formatCurrency } from '../../utils/format';

interface SellerTableProps {
  sellers: Seller[];
  onEdit: (seller: Seller) => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

const SellerTable: React.FC<SellerTableProps> = ({
  sellers,
  onEdit,
  onDelete,
  loading
}) => {
  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'FULL_TIME':
        return 'Tiempo Completo';
      case 'PART_TIME':
        return 'Medio Tiempo';
      case 'CONTRACTOR':
        return 'Contratista';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Foto</th>
            <th className="p-3 text-left">Nombre</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Teléfono</th>
            <th className="p-3 text-left">Dirección</th>
            <th className="p-3 text-left">Contrato</th>
            <th className="p-3 text-left">Salario</th>
            <th className="p-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="p-3 text-center">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2">Cargando vendedores...</span>
                </div>
              </td>
            </tr>
          ) : sellers.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-3 text-center text-gray-500">
                No hay vendedores registrados
              </td>
            </tr>
          ) : (
            sellers.map((seller) => (
              <tr key={seller.id} className="border-t">
                <td className="p-3">
                  {seller.photo_url ? (
                    <img
                      src={seller.photo_url}
                      alt={seller.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40x40?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                  )}
                </td>
                <td className="p-3">{seller.name}</td>
                <td className="p-3">{seller.email}</td>
                <td className="p-3">{seller.phone}</td>
                <td className="p-3">{seller.address}</td>
                <td className="p-3">{getContractTypeLabel(seller.contract_type)}</td>
                <td className="p-3">{formatCurrency(seller.salary)}</td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(seller)}
                      className="text-blue-500 hover:text-blue-700"
                      disabled={loading}
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => onDelete(seller.id)}
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
  );
};

export default SellerTable;