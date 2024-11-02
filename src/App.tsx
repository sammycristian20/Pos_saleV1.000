import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CashRegisterProvider } from './contexts/CashRegisterContext';
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
import Secuencias from './components/Secuencias';
import CashRegister from './components/CashRegister';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CashRegisterProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/pos" element={<POS />} />
                      <Route path="/caja" element={<CashRegister />} />
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
                      <Route path="/secuencias" element={<Secuencias />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </CashRegisterProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;