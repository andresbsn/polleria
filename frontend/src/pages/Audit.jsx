import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Audit = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ action: '', entity_id: '', user_id: '', from: '', to: '', limit: '100' });

    const CardRow = (label, value) => (
        <div className="report-card-row">
            <div className="report-card-label">{label}</div>
            <div className="report-card-value">{value}</div>
        </div>
    );

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.action) params.action = filters.action;
            if (filters.entity_id) params.entity_id = filters.entity_id;
            if (filters.user_id) params.user_id = filters.user_id;
            if (filters.from) params.from = filters.from;
            if (filters.to) params.to = filters.to;
            if (filters.limit) params.limit = filters.limit;

            const { data } = await api.get('/api/audit', { params });
            setLogs(data);
        } catch (e) {
            alert('Error cargando auditoría');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="page-container">
            <div className="flex-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Auditoría</h1>
                    <p className="text-secondary">Registro de movimientos y cambios</p>
                </div>
                <button className="secondary-btn" onClick={loadLogs} disabled={loading}>
                    {loading ? '...' : 'Actualizar'}
                </button>
            </div>

            <div className="glass-panel p-4 mb-6">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <input
                        className="input-field w-full p-2"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                        placeholder="Acción (PRICE_CHANGE, STOCK_IN...)"
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    />
                    <input
                        className="input-field w-full p-2"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                        placeholder="Entity ID"
                        value={filters.entity_id}
                        onChange={(e) => setFilters({ ...filters, entity_id: e.target.value })}
                    />
                    <input
                        className="input-field w-full p-2"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                        placeholder="User ID"
                        value={filters.user_id}
                        onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                    />
                    <input
                        type="date"
                        className="input-field w-full p-2"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                        value={filters.from}
                        onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                    />
                    <input
                        type="date"
                        className="input-field w-full p-2"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                        value={filters.to}
                        onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                    />
                    <input
                        type="number"
                        min="1"
                        max="500"
                        className="input-field w-full p-2"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                        placeholder="Limit"
                        value={filters.limit}
                        onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
                    />
                </div>
                <div className="flex-between" style={{ marginTop: '1rem' }}>
                    <div className="text-secondary">{logs.length} registros</div>
                    <div className="flex-center gap-2">
                        <button
                            className="secondary-btn"
                            type="button"
                            onClick={() => {
                                setFilters({ action: '', entity_id: '', user_id: '', from: '', to: '', limit: '100' });
                                setTimeout(() => loadLogs(), 0);
                            }}
                            disabled={loading}
                        >
                            Limpiar
                        </button>
                        <button className="primary-btn" onClick={loadLogs} disabled={loading}>Buscar</button>
                    </div>
                </div>
            </div>

            <div className="report-card-grid">
                {loading ? (
                    <div className="glass-panel p-6 text-center text-secondary">Cargando...</div>
                ) : logs.map((l) => (
                    <div key={l.id} className="report-card">
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <div className="text-secondary" style={{ fontSize: '0.9rem' }}>#{l.id}</div>
                            <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                {l.created_at ? new Date(l.created_at).toLocaleString() : '-'}
                            </div>
                        </div>

                        {CardRow('Usuario', l.username || l.user_id || '-')}
                        {CardRow('Acción', <span className="text-accent font-bold">{l.action}</span>)}
                        {CardRow('Entity', l.entity_id ?? '-')}

                        <div className="report-card-row">
                            <div className="report-card-label">Detalles</div>
                            <div className="report-card-value" style={{ textAlign: 'right' }}>
                                <details>
                                    <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Ver</summary>
                                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem', opacity: 0.9, marginTop: '0.5rem' }}>
                                        {l.details ? JSON.stringify(l.details, null, 2) : '-'}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && logs.length === 0 && (
                    <div className="glass-panel p-8 text-center text-secondary">No hay registros.</div>
                )}
            </div>
        </div>
    );
};

export default Audit;
