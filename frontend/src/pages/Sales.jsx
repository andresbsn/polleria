import React, { useState, useEffect, useRef } from 'react';
import { getSales, retryInvoice, getSaleById } from '../services/api';
import { FaFileInvoice, FaCheckCircle, FaExclamationTriangle, FaRedo, FaSearch } from 'react-icons/fa';
import Ticket from '../components/Ticket';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [retryLoading, setRetryLoading] = useState(null);
    const [saleToPrint, setSaleToPrint] = useState(null);
    const componentRef = useRef();

    useEffect(() => {
        loadSales();
    }, []);

    // Effect to trigger print when saleToPrint is ready
    useEffect(() => {
        if (saleToPrint) {
            // Small delay to ensure render
            setTimeout(() => {
                window.print();
                // Optional: clear saleToPrint after printing if needed, 
                // but usually user might want to print again or close manually.
                // Resetting it might hide the component too fast for the print dialog.
                // Better strategy: keep it there, maybe clear on new selection or simple timeout logic isn't perfect but works for now.
             }, 500);
        }
    }, [saleToPrint]);

    const loadSales = async () => {
        setLoading(true);
        try {
            const { data } = await getSales();
            setSales(data);
        } catch (error) {
            console.error("Error loading sales", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (saleId) => {
        setRetryLoading(saleId);
        try {
            await retryInvoice({ saleId });
            await loadSales(); // Refresh list to see new status
        } catch (error) {
            console.error("Retry failed", error);
            alert("Retry failed: " + (error.response?.data?.error || error.message));
        } finally {
            setRetryLoading(null);
        }
    };

    const handlePrint = async (saleId) => {
        try {
            const { data } = await getSaleById(saleId);
            setSaleToPrint(data);
        } catch (error) {
            console.error("Error fetching sale details", error);
            alert("Error al cargar detalles de la venta");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    return (
        <div className="page-container">
            <div className="flex-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Historial de Ventas</h1>
                    <p className="text-secondary">Últimas 50 operaciones</p>
                </div>
                <button className="secondary-btn" onClick={loadSales}>
                    <FaRedo /> Actualizar
                </button>
            </div>

            <div className="table-container glass-panel">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th className="p-4">ID</th>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Medio Pago</th>
                            <th className="p-4">Estado AFIP</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="p-4 text-center">Cargando...</td></tr>
                        ) : sales.map(sale => (
                            <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="p-4 text-secondary">#{sale.id}</td>
                                <td className="p-4">{formatDate(sale.created_at)}</td>
                                <td className="p-4 font-bold">{sale.client_name || 'Consumidor Final'}</td>
                                <td className="p-4 text-accent font-bold">${Number(sale.total).toFixed(2)}</td>
                                <td className="p-4 text-sm"><span className="badge badge-secondary">{sale.payment_method}</span></td>
                                <td className="p-4">
                                    {sale.invoice_status === 'APPROVED' ? (
                                        <div className="text-success flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                                            <FaCheckCircle /> 
                                            <span>CAE: {sale.cae}</span>
                                        </div>
                                    ) : sale.invoice_status === 'ERROR' ? (
                                        <div className="text-danger flex-center gap-1" style={{ justifyContent: 'flex-start' }} title={sale.afip_error}>
                                            <FaExclamationTriangle /> 
                                            <span>Error</span>
                                        </div>
                                    ) : (
                                        <span className="text-secondary opacity-50">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {sale.invoice_status === 'ERROR' && (
                                        <button 
                                            onClick={() => handleRetry(sale.id)} 
                                            className="secondary-btn text-xs" 
                                            disabled={retryLoading === sale.id}
                                        >
                                            {retryLoading === sale.id ? '...' : <FaRedo />} Reintentar
                                        </button>
                                    )}
                                    {sale.invoice_status === 'APPROVED' && (
                                        <button 
                                            className="secondary-btn text-xs text-secondary"
                                            onClick={() => handlePrint(sale.id)}
                                        >
                                            <FaFileInvoice /> Ver
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sales.length === 0 && !loading && (
                    <div className="p-8 text-center text-secondary">No hay ventas registradas.</div>
                )}
            </div>

            {/* Hidden Ticket for Printing */}
            <div style={{ display: 'none' }}>
                <div className="printable-area" ref={componentRef}>
                     {saleToPrint && <Ticket sale={saleToPrint} />}
                </div>
            </div>
        </div>
    );
};

export default Sales;
