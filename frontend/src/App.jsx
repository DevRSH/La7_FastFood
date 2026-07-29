import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import PinScreen from './components/auth/PinScreen';
import Layout from './components/layout/Layout';

// Pages
import POS from './pages/POS';
import FichasTecnicas from './pages/FichasTecnicas';
import Insumos from './pages/Insumos';
import Stock from './pages/Stock';
import Ventas from './pages/Ventas';
import Clientes from './pages/Clientes';
import Dashboard from './pages/Dashboard';
import Configuracion from './pages/Configuracion';

function App() {
  const { isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <PinScreen onLogin={login} />;
  }

  return (
    <Layout onLogout={logout}>
      <Routes>
        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/fichas" element={<FichasTecnicas />} />
        <Route path="/insumos" element={<Insumos />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/config" element={<Configuracion />} />
      </Routes>
    </Layout>
  );
}

export default App;
