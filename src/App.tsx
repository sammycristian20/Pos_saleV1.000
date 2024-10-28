import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Usuarios from './components/Usuarios';
import Impuestos from './components/Impuestos';
import Clientes from './components/Clientes';
import CuentasPorPagar from './components/CuentasPorPagar';
import Inventario from './components/Inventario';
import Configuracion from './components/Configuracion';
import Reportes from './components/Reportes';
import Categorias from './components/Categorias';
import POS from './components/POS';
import Layout from './components/Layout';
import Facturas from './components/Facturas';
import Descuentos from './components/Descuentos';

function App() {
  const [showExtensionWarning, setShowExtensionWarning] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Handle timezone extension errors gracefully
      if (
        event.message.includes('getAttribute') ||
        event.message.includes('timezone') ||
        event.message.includes('inject-content')
      ) {
        setShowExtensionWarning(true);
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // For other errors, let them propagate normally
      console.error('Application error:', event);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', () => {});
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  {showExtensionWarning && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 fixed top-4 right-4 z-50 max-w-md shadow-lg rounded" role="alert">
                      <div className="flex">
                        <div className="py-1">
                          <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold">Advertencia</p>
                          <p className="text-sm">Se ha detectado un conflicto con una extensión del navegador. Si experimenta problemas, intente desactivar las extensiones relacionadas con cambios de zona horaria.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pos" element={<POS />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/impuestos" element={<Impuestos />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/cuentas-por-pagar" element={<CuentasPorPagar />} />
                    <Route path="/inventario" element={<Inventario />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                    <Route path="/reportes" element={<Reportes />} />
                    <Route path="/categorias" element={<Categorias />} />
                    <Route path="/facturas" element={<Facturas />} />
                    <Route path="/descuentos" element={<Descuentos />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;