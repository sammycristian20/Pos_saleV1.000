import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  DollarSign, 
  Users as ClientsIcon, 
  CreditCard, 
  Package, 
  Settings, 
  BarChart, 
  Tag, 
  LogOut, 
  ShoppingCart, 
  FileText, 
  Percent,
  Hash,
  Calculator
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <p className="text-sm text-gray-600">Bienvenido,</p>
          <p className="font-semibold truncate">{user?.email}</p>
        </div>
        <nav className="mt-5">
          <Link to="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Home className="mr-3" size={20} />
            Dashboard
          </Link>
          <Link to="/pos" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <ShoppingCart className="mr-3" size={20} />
            Punto de Venta
          </Link>
          <Link to="/caja" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Calculator className="mr-3" size={20} />
            Caja
          </Link>
          <Link to="/usuarios" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Users className="mr-3" size={20} />
            Usuarios
          </Link>
          <Link to="/impuestos" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <DollarSign className="mr-3" size={20} />
            Impuestos
          </Link>
          <Link to="/descuentos" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Percent className="mr-3" size={20} />
            Descuentos
          </Link>
          <Link to="/clientes" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <ClientsIcon className="mr-3" size={20} />
            Clientes
          </Link>
          <Link to="/facturas" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <FileText className="mr-3" size={20} />
            Facturas
          </Link>
          <Link to="/secuencias" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Hash className="mr-3" size={20} />
            Secuencias Fiscales
          </Link>
          <Link to="/cuentas-por-pagar" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <CreditCard className="mr-3" size={20} />
            Cuentas por Pagar
          </Link>
          <Link to="/inventario" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Package className="mr-3" size={20} />
            Inventario
          </Link>
          <Link to="/categorias" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Tag className="mr-3" size={20} />
            Categorías
          </Link>
          <Link to="/reportes" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <BarChart className="mr-3" size={20} />
            Reportes
          </Link>
          <Link to="/configuracion" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Settings className="mr-3" size={20} />
            Configuración
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 mt-4"
          >
            <LogOut className="mr-3" size={20} />
            Cerrar Sesión
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;