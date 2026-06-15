// frontend/src/App.jsx

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
                <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                  <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Bienvenido a Mi App</h2>
                    <Dashboard />
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/picking" 
            element={
              <ProtectedRoute title="Auditoría de Picking">
                <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                  <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Auditoría de Picking</h2>
                    <PickingAudit />
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/view_picking_audits" 
            element={
              <ProtectedRoute title="Pickings Empacados">
                <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                  <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Pickings Empacados</h2>
                    <PickingAuditHistory />
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/shipments" 
            element={
              <ProtectedRoute title="Envíos Consolidados">
                <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                  <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Envíos Consolidados</h2>
                    <Shipments />
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute title={localStorage.getItem('auditor_lang') === 'pt' ? 'Configuração' : 'Settings'}>
                <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                  <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Configuración</h2>
                    <Settings />
                  </div>
                </div>
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