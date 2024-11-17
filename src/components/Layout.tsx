import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Users,
  DollarSign,
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
  Calculator,
  Upload,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navigationLinks = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/pos', label: 'Punto de Venta', icon: <ShoppingCart size={20} /> },
    { path: '/caja', label: 'Caja', icon: <Calculator size={20} /> },
    { path: '/usuarios', label: 'Usuarios', icon: <Users size={20} /> },
    { path: '/vendedores', label: 'Vendedores', icon: <UserCheck size={20} /> },
    { path: '/impuestos', label: 'Impuestos', icon: <DollarSign size={20} /> },
    { path: '/descuentos', label: 'Descuentos', icon: <Percent size={20} /> },
    { path: '/clientes', label: 'Clientes', icon: <Users size={20} /> },
    { path: '/facturas', label: 'Facturas', icon: <FileText size={20} /> },
    { path: '/secuencias', label: 'Secuencias', icon: <Hash size={20} /> },
    { path: '/cuentas-por-pagar', label: 'Cuentas por Pagar', icon: <CreditCard size={20} /> },
    { path: '/inventario', label: 'Inventario', icon: <Package size={20} /> },
    { path: '/carga-masiva', label: 'Carga Masiva', icon: <Upload size={20} /> },
    { path: '/categorias', label: 'Categorías', icon: <Tag size={20} /> },
    { path: '/reportes', label: 'Reportes', icon: <BarChart size={20} /> },
    { path: '/configuracion', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`bg-gray-900 text-white transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between">
            {isExpanded ? (
              <span className="text-xl font-bold">POS System</span>
            ) : (
              <span className="text-xl font-bold mx-auto">PS</span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-gray-800"
            >
              {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="space-y-1 px-2">
              {navigationLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <div className="min-w-[20px]">{link.icon}</div>
                  {isExpanded && <span className="ml-3">{link.label}</span>}
                </Link>
              ))}
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              {isExpanded && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.email?.split('@')[0]}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => signOut()}
              className={`flex items-center w-full px-4 py-2 text-gray-400 hover:bg-gray-800 rounded-lg ${
                isExpanded ? 'justify-start' : 'justify-center'
              }`}
            >
              <LogOut size={20} />
              {isExpanded && <span className="ml-3">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;