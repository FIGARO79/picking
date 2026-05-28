import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PickingAudit from './pages/PickingAudit';
import PickingAuditHistory from './pages/PickingAuditHistory';
import Shipments from './pages/Shipments';
import PackingListPrint from './pages/PackingListPrint';
import Settings from './pages/Settings';

// HOC para proteger las rutas. Si no se ha ingresado un nombre de auditor, redirige a /login
const ProtectedRoute = ({ children, title }) => {
  const auditorName = localStorage.getItem('auditor_name');
  if (!auditorName) {
    return <Navigate to="/login" replace />;
  }
  return <Layout title={title}>{children}</Layout>;
};

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>

        {/* Ruta de Login (Firma de Auditor) */}
        <Route path="/login" element={<Login />} />

        {/* Rutas Protegidas encapsuladas con Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute title="Dashboard">
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/picking" 
          element={
            <ProtectedRoute title="Auditoría de Picking">
              <PickingAudit />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/view_picking_audits" 
          element={
            <ProtectedRoute title="Pickings Empacados">
              <PickingAuditHistory />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/shipments" 
          element={
            <ProtectedRoute title="Envíos Consolidados">
              <Shipments />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute title={localStorage.getItem('auditor_lang') === 'pt' ? 'Configuração' : 'Configuración'}>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Vista previa de Impresión (Sin Layout para window.print) */}
        <Route path="/packing_list/print/:id" element={<PackingListPrint />} />

        {/* Fallback de redirección */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </LanguageProvider>
  );
}

export default App;
