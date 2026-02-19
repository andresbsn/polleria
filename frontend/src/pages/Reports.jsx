import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const [byDay, setByDay] = useState([]);
    const [byPayment, setByPayment] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [byUser, setByUser] = useState([]);
    const [invoiceSummary, setInvoiceSummary] = useState([]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const params = {};
            if (from) params.from = from;
            if (to) params.to = to;

            const [r1, r2, r3, r4, r5] = await Promise.all([
                api.get('/api/reports/sales-by-day', { params }),
                api.get('/api/reports/sales-by-payment-method', { params }),
                api.get('/api/reports/top-products', { params }),
                api.get('/api/reports/sales-by-user', { params }),
                api.get('/api/reports/invoice-summary', { params }),
            ]);

            setByDay(r1.data);
            setByPayment(r2.data);
            setTopProducts(r3.data);
            setByUser(r4.data);
            setInvoiceSummary(r5.data);
        } catch (e) {
            alert('Error cargando reportes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const money = (n) => {
        const v = Number(n || 0);
        return v.toFixed(2);
    };

    const kpi = (() => {
        const totalSales = byPayment.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
        const salesCount = byPayment.reduce((sum, r) => sum + Number(r.sales_count || 0), 0);
        const avgTicket = salesCount > 0 ? totalSales / salesCount : 0;
        return { totalSales, salesCount, avgTicket };
    })();

    const CardRow = ({ label, value, valueClassName }) => {
        return (
            <div className="report-card-row">
                <div className="report-card-label">{label}</div>
                <div className={valueClassName ? `report-card-value ${valueClassName}` : 'report-card-value'}>{value}</div>
            </div>
        );
    };

    return (
        <div className="page-container">
            <div className="flex-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Reportes</h1>
                    <p className="text-secondary">Ventas y estadísticas</p>
                </div>
                <button className="secondary-btn" onClick={loadAll} disabled={loading}>
                    {loading ? '...' : 'Actualizar'}
                </button>
            </div>

            <div className="glass-panel p-4 mb-6 report-filters">
                <div className="report-filters-grid">
                    <div>
                        <div className="text-secondary" style={{ marginBottom: '0.25rem' }}>Desde</div>
                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div>
                        <div className="text-secondary" style={{ marginBottom: '0.25rem' }}>Hasta</div>
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <button className="primary-btn" onClick={loadAll} disabled={loading}>Aplicar filtros</button>
                    <button
                        className="secondary-btn"
                        onClick={() => {
                            setFrom('');
                            setTo('');
                            setTimeout(loadAll, 0);
                        }}
                        disabled={loading}
                    >
                        Limpiar
                    </button>
                </div>
                <div className="text-secondary" style={{ marginTop: '0.75rem' }}>
                    {(from || to) ? `Rango aplicado: ${from || '...'} a ${to || '...'}` : 'Sin filtros de fecha (mostrando todo)'}
                </div>
            </div>

            <div className="report-kpi-grid mb-6">
                <div className="glass-panel p-4 report-kpi">
                    <div className="text-secondary">Total vendido</div>
                    <div className="report-kpi-value">${money(kpi.totalSales)}</div>
                </div>
                <div className="glass-panel p-4 report-kpi">
                    <div className="text-secondary">Cantidad de ventas</div>
                    <div className="report-kpi-value">{kpi.salesCount}</div>
                </div>
                <div className="glass-panel p-4 report-kpi">
                    <div className="text-secondary">Ticket promedio</div>
                    <div className="report-kpi-value">${money(kpi.avgTicket)}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel p-4">
                    <h2 className="text-xl font-bold mb-4">Ventas por día</h2>
                    <div className="report-card-grid">
                        {byDay.map((r) => (
                            <div key={r.day} className="report-card">
                                <CardRow label="Día" value={r.day} />
                                <CardRow label="Ventas" value={r.sales_count} />
                                <CardRow label="Total" value={`$${money(r.total_amount)}`} valueClassName="text-accent font-bold" />
                            </div>
                        ))}
                        {!loading && byDay.length === 0 && <div className="p-4 text-secondary">Sin datos</div>}
                    </div>
                </div>

                <div className="glass-panel p-4">
                    <h2 className="text-xl font-bold mb-4">Por medio de pago</h2>
                    <div className="report-card-grid">
                        {byPayment.map((r) => (
                            <div key={r.payment_method} className="report-card">
                                <CardRow label="Medio" value={r.payment_method} />
                                <CardRow label="Ventas" value={r.sales_count} />
                                <CardRow label="Total" value={`$${money(r.total_amount)}`} valueClassName="text-accent font-bold" />
                            </div>
                        ))}
                        {!loading && byPayment.length === 0 && <div className="p-4 text-secondary">Sin datos</div>}
                    </div>
                </div>

                <div className="glass-panel p-4">
                    <h2 className="text-xl font-bold mb-4">Top productos</h2>
                    <div className="report-card-grid">
                        {topProducts.map((r) => (
                            <div key={r.product_id} className="report-card">
                                <CardRow label="Producto" value={r.product_name} />
                                <CardRow label="Cantidad" value={r.qty_sold} />
                                <CardRow label="Importe" value={`$${money(r.amount)}`} valueClassName="text-accent font-bold" />
                            </div>
                        ))}
                        {!loading && topProducts.length === 0 && <div className="p-4 text-secondary">Sin datos</div>}
                    </div>
                </div>

                <div className="glass-panel p-4">
                    <h2 className="text-xl font-bold mb-4">Ventas por usuario</h2>
                    <div className="report-card-grid">
                        {byUser.map((r, idx) => (
                            <div key={`${r.user_id}-${idx}`} className="report-card">
                                <CardRow label="Usuario" value={r.username} />
                                <CardRow label="Ventas" value={r.sales_count} />
                                <CardRow label="Total" value={`$${money(r.total_amount)}`} valueClassName="text-accent font-bold" />
                            </div>
                        ))}
                        {!loading && byUser.length === 0 && <div className="p-4 text-secondary">Sin datos</div>}
                    </div>
                </div>

                <div className="glass-panel p-4">
                    <h2 className="text-xl font-bold mb-4">Facturación</h2>
                    <div className="report-card-grid">
                        {invoiceSummary.map((r) => (
                            <div key={r.invoice_group} className="report-card">
                                <CardRow label="Grupo" value={r.invoice_group} />
                                <CardRow label="Ventas" value={r.sales_count} />
                                <CardRow label="Total" value={`$${money(r.total_amount)}`} valueClassName="text-accent font-bold" />
                            </div>
                        ))}
                        {!loading && invoiceSummary.length === 0 && <div className="p-4 text-secondary">Sin datos</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
