import React, { useState, useEffect, useRef } from 'react';
import { getSales, retryInvoice, getSaleById } from '../services/api';
import { FaFileInvoice, FaCheckCircle, FaExclamationTriangle, FaRedo, FaSearch } from 'react-icons/fa';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [retryLoading, setRetryLoading] = useState(null);

    useEffect(() => {
        loadSales();
    }, []);

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
            await loadSales();
        } catch (error) {
            console.error("Retry failed", error);
            alert("Retry failed: " + (error.response?.data?.error || error.message));
        } finally {
            setRetryLoading(null);
        }
    };

    const handlePrint = async (saleId) => {
        try {
            const { data: sale } = await getSaleById(saleId);

            const ventana = window.open('', '_blank', 'width=600,height=900');
            if (!ventana) {
                alert('Habilite las ventanas emergentes para ver la factura.');
                return;
            }

            const razonSocial = 'Los Nonos';
            const cuit = '20-43056237-2';
            const domicilio = '24 de Octubre, Villa Ramallo';
            const condicionIVA = 'Responsable Inscripto';

            const total = Number(sale.total || 0);
            const neto = (total / 1.105).toFixed(2);
            const iva = (total - total / 1.105).toFixed(2);

            const tipoComp = sale.cbte_tipo === 1 ? 'A' : sale.cbte_tipo === 6 ? 'B' : sale.cbte_tipo === 11 ? 'C' : 'B';
            const nroComp = sale.pto_vta && sale.cbte_nro
                ? `${String(sale.pto_vta).padStart(4, '0')}-${String(sale.cbte_nro).padStart(8, '0')}`
                : '-';

            const fecha = sale.created_at ? new Date(sale.created_at).toLocaleDateString('es-AR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : '-';

            const formatMonto = (m) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(m);

            const formatVtoCAE = (vto) => {
                if (!vto) return '-';
                const str = String(vto).replace(/-/g, '');
                if (str.length === 8) return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
                return new Date(vto).toLocaleDateString('es-AR');
            };

            const contenido = `
            <html>
            <head>
                <title>Factura ${nroComp}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; font-size: 12px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 12px; }
                    .header h1 { font-size: 18px; margin-bottom: 4px; }
                    .tipo-factura { display: inline-block; border: 2px solid #333; padding: 4px 16px; font-size: 22px; font-weight: bold; margin: 8px 0; }
                    .datos-emisor { margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
                    .datos-emisor p { margin: 2px 0; }
                    .datos-factura { display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 12px; }
                    .datos-factura .col { flex: 1; }
                    .row { margin: 4px 0; display: flex; justify-content: space-between; }
                    .label { font-weight: bold; }
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                    .items-table th, .items-table td { padding: 4px 8px; text-align: left; border-bottom: 1px solid #eee; }
                    .items-table th { border-bottom: 2px solid #333; }
                    .totales { border-top: 2px solid #333; margin-top: 12px; padding-top: 8px; }
                    .total-final { font-size: 16px; font-weight: bold; margin-top: 8px; }
                    .cae-section { margin-top: 16px; border-top: 2px solid #333; padding-top: 8px; text-align: center; }
                    .cae-section .cae-number { font-size: 14px; font-weight: bold; letter-spacing: 1px; }
                    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
                    .status-approved { background: #d4edda; color: #155724; }
                    .status-error { background: #f8d7da; color: #721c24; }
                    .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #666; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${razonSocial}</h1>
                    <div class="tipo-factura">${tipoComp}</div>
                </div>

                <div class="datos-emisor">
                    <p><span class="label">Razón Social:</span> ${razonSocial}</p>
                    <p><span class="label">Domicilio:</span> ${domicilio}</p>
                    <p><span class="label">CUIT:</span> ${cuit}</p>
                    <p><span class="label">Condición IVA:</span> ${condicionIVA}</p>
                </div>

                <div class="datos-factura">
                    <div class="col">
                        <p><span class="label">Comprobante Nro:</span> ${nroComp}</p>
                        <p><span class="label">Fecha:</span> ${fecha}</p>
                        <p><span class="label">Punto de Venta:</span> ${sale.pto_vta ? String(sale.pto_vta).padStart(4, '0') : '-'}</p>
                    </div>
                    <div class="col" style="text-align: right;">
                        <p><span class="label">Cliente:</span> ${sale.client_name || 'Consumidor Final'}</p>
                        <p><span class="label">Medio Pago:</span> ${sale.payment_method || '-'}</p>
                    </div>
                </div>

                ${sale.items && sale.items.length > 0 ? `
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Cant</th>
                            <th>Descripción</th>
                            <th style="text-align: right;">Precio</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sale.items.map(item => `
                            <tr>
                                <td>${item.quantity}</td>
                                <td>${item.name || item.product_name || '-'}</td>
                                <td style="text-align: right;">$ ${formatMonto(item.price_at_sale || item.price || 0)}</td>
                                <td style="text-align: right;">$ ${formatMonto((item.price_at_sale || item.price || 0) * item.quantity)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}

                <div class="totales">
                    <div class="row">
                        <span class="label">Neto Gravado:</span>
                        <span>$ ${formatMonto(neto)}</span>
                    </div>
                    <div class="row">
                        <span class="label">IVA 10,5%:</span>
                        <span>$ ${formatMonto(iva)}</span>
                    </div>
                    ${sale.discount && Number(sale.discount) > 0 ? `
                    <div class="row">
                        <span class="label">Descuento${sale.discount_percent ? ` (${sale.discount_percent}%)` : ''}:</span>
                        <span>-$ ${formatMonto(sale.discount)}</span>
                    </div>
                    ` : ''}
                    <div class="row total-final">
                        <span>TOTAL:</span>
                        <span>$ ${formatMonto(total)}</span>
                    </div>
                </div>

                ${sale.cae ? `
                <div class="cae-section">
                    <p><span class="label">CAE Nro:</span> <span class="cae-number">${sale.cae}</span></p>
                    <p><span class="label">Vto CAE:</span> ${formatVtoCAE(sale.cae_expiration)}</p>
                    <p style="margin-top: 4px;">
                        <span class="status-badge ${sale.invoice_status === 'APPROVED' ? 'status-approved' : 'status-error'}">
                            ${sale.invoice_status === 'APPROVED' ? '✓ APROBADA' : '✗ ERROR'}
                        </span>
                    </p>
                </div>
                ` : ''}

                <div class="footer">
                    <p>Comprobante generado electrónicamente</p>
                </div>
            </body>
            </html>`;

            ventana.document.write(contenido);
            ventana.document.close();
            ventana.focus();
            setTimeout(() => ventana.print(), 300);

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
        </div>
    );
};

export default Sales;
