import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import POS from './pages/POS';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Stock from './pages/Stock';
import Reports from './pages/Reports';
import Audit from './pages/Audit';
import Configuration from './pages/Configuration';
import Facturacion from './pages/Facturacion';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    if (token) {
      setUser({ token, role, username });
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('username', userData.username);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Role check helper
  const ProtectedRoute = ({ children }) => {
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const SuperAdminRoute = ({ children }) => {
    if (user.role !== 'superadmin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} onLogout={handleLogout} />
        <main>
          <Routes>
            {/* POS and Sales available to everyone? Or maybe User = POS only? 
                User said "usuario de venta solo puede ver el modelo de ventas". 
                I'll assume POS and Sales History are "Sales Model".
                Products and Stock are definitely Admin.
            */}
            <Route path="/" element={<POS />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetails />} />
            
            {/* Admin Only Routes */}
            <Route path="/products" element={
              <ProtectedRoute><Products /></ProtectedRoute>
            } />
            <Route path="/stock" element={
              <ProtectedRoute><Stock /></ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute><Reports /></ProtectedRoute>
            } />

            <Route path="/audit" element={
              <SuperAdminRoute><Audit /></SuperAdminRoute>
            } />

            <Route path="/config" element={
              <SuperAdminRoute><Configuration /></SuperAdminRoute>
            } />
            <Route path="/facturacion" element={
              <ProtectedRoute><Facturacion /></ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
