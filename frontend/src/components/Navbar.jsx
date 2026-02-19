import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaDrumstickBite, FaCashRegister, FaHistory, FaBoxOpen, FaSignOutAlt, FaUser, FaChartBar, FaClipboardList, FaCog, FaFileInvoiceDollar } from 'react-icons/fa';

const Navbar = ({ user, onLogout }) => {
    const location = useLocation();

    // Default items for everyone (POS, Sales History)
    let navItems = [
        { path: '/', label: 'POS', icon: <FaCashRegister /> },
        { path: '/sales', label: 'Ventas', icon: <FaHistory /> },
        { path: '/clients', label: 'Clientes', icon: <FaUser /> },
    ];

    // Admin extras
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        navItems.push(
            { path: '/products', label: 'Productos', icon: <FaDrumstickBite /> },
            { path: '/stock', label: 'Stock', icon: <FaBoxOpen /> },
            { path: '/reports', label: 'Reportes', icon: <FaChartBar /> },
            { path: '/facturacion', label: 'Facturación', icon: <FaFileInvoiceDollar /> }
        );
    }

    if (user && user.role === 'superadmin') {
        navItems.push({ path: '/audit', label: 'Auditoría', icon: <FaClipboardList /> });
        navItems.push({ path: '/config', label: 'Configuración', icon: <FaCog /> });
    }

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-top">
                <div className="navbar-logo">
                    <FaDrumstickBite />
                </div>

                <div className="navbar-items">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`navbar-item ${isActive ? 'active' : ''}`}
                                title={item.label}
                            >
                                <span className="navbar-icon">{item.icon}</span>
                                <span className="navbar-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={onLogout}
                className="navbar-logout"
                title="Cerrar Sesión"
            >
                <FaSignOutAlt size={20} />
            </button>
        </nav>
    );
};

export default Navbar;
