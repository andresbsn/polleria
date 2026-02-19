import React, { useMemo, useState, useEffect } from 'react';
import { getClientById, registerClientPayment } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMoneyBillWave, FaHistory, FaTimes } from 'react-icons/fa';

const ClientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Payment Modal
    const [showPayModal, setShowPayModal] = useState(false);
    const [payment, setPayment] = useState({ amount: '', method: 'Efectivo', notes: '' });

    // Movements filters
    const [movType, setMovType] = useState('ALL');
    const [movFrom, setMovFrom] = useState('');
    const [movTo, setMovTo] = useState('');

    useEffect(() => {
        loadClient();
    }, [id]);

    const loadClient = async () => {
        try {
            const { data } = await getClientById(id);
            setClient(data);
        } catch (error) {
            console.error(error);
            alert("Error cargando cliente");
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await registerClientPayment({
                client_id: id,
                amount: payment.amount,
                payment_method: payment.method,
                notes: payment.notes
            });
            setShowPayModal(false);
            setPayment({ amount: '', method: 'Efectivo', notes: '' });
            loadClient(); // Refresh
        } catch (error) {
            alert(error.message);
        }
    };

    const filteredMovements = useMemo(() => {
        const movements = Array.isArray(client?.movements) ? client.movements : [];
        const fromDate = movFrom ? new Date(`${movFrom}T00:00:00`) : null;
        const toDate = movTo ? new Date(`${movTo}T23:59:59`) : null;

        return movements
            .filter(m => {
                if (movType !== 'ALL' && m.type !== movType) return false;
                const created = new Date(m.created_at);
                if (fromDate && created < fromDate) return false;
                if (toDate && created > toDate) return false;
                return true;
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [client?.movements, movFrom, movTo, movType]);

    if (loading) return <div className="p-8">Cargando...</div>;
    if (!client) return <div className="p-8">Cliente no encontrado</div>;

    const balance = Number(client.current_account_balance);

    return (
        <div className="page-container">
            <button className="secondary-btn mb-4 flex-center gap-2" onClick={() => navigate('/clients')}>
                <FaArrowLeft /> Volver
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Info Card */}
                <div className="glass-panel p-6 col-span-2">
                    <h1 className="text-3xl font-bold mb-4">{client.name}</h1>
                    <div className="grid grid-cols-2 gap-4">
                        <p><span className="text-secondary">DNI/CUIT:</span> {client.tax_id || '-'}</p>
                        <p><span className="text-secondary">Teléfono:</span> {client.phone || '-'}</p>
                        <p><span className="text-secondary">Dirección:</span> {client.address || '-'}</p>
                        <p><span className="text-secondary">Email:</span> {client.email || '-'}</p>
                    </div>
                </div>

                {/* Balance Card */}
                <div className={`glass-panel p-6 flex flex-col justify-center items-center ${balance > 0 ? 'border-red-500 border' : 'border-green-500 border'}`}>
                    <h3 className="text-secondary mb-2">Cuenta Corriente</h3>
                    <h2 className={`text-4xl font-bold mb-4 ${balance > 0 ? 'text-danger' : 'text-success'}`}>
                        ${balance.toFixed(2)}
                    </h2>
                    {balance > 0 && (
                        <button className="primary-btn w-full flex-center gap-2" onClick={() => setShowPayModal(true)}>
                            <FaMoneyBillWave /> Registrar Pago
                        </button>
                    )}
                </div>
            </div>

            {/* Movements */}
            <div className="glass-panel p-6">
                <h2 className="text-xl font-bold mb-4 flex-center gap-2 justify-start">
                    <FaHistory /> Historial de Movimientos
                </h2>
                <div className="glass-panel p-4" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label className="block text-secondary text-sm mb-1">Tipo</label>
                            <select
                                className="input-field w-full"
                                value={movType}
                                onChange={(e) => setMovType(e.target.value)}
                                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                            >
                                <option value="ALL">Todos</option>
                                <option value="SALE">Compras</option>
                                <option value="PAYMENT">Pagos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-secondary text-sm mb-1">Desde</label>
                            <input
                                type="date"
                                className="input-field w-full"
                                value={movFrom}
                                onChange={(e) => setMovFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-secondary text-sm mb-1">Hasta</label>
                            <input
                                type="date"
                                className="input-field w-full"
                                value={movTo}
                                onChange={(e) => setMovTo(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-between" style={{ marginTop: '0.75rem' }}>
                        <div className="text-secondary" style={{ fontSize: '0.9rem' }}>
                            Mostrando: <span className="font-bold">{filteredMovements.length}</span>
                        </div>
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => { setMovType('ALL'); setMovFrom(''); setMovTo(''); }}
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {!client.movements || client.movements.length === 0 ? (
                    <div className="text-secondary" style={{ opacity: 0.8 }}>Sin movimientos.</div>
                ) : filteredMovements.length === 0 ? (
                    <div className="text-secondary" style={{ opacity: 0.8 }}>No hay movimientos para los filtros seleccionados.</div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto" style={{ width: '100%' }}>
                            <table
                                className="w-full text-left"
                                style={{ minWidth: '900px', tableLayout: 'auto', borderCollapse: 'separate', borderSpacing: 0 }}
                            >
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="p-2" style={{ whiteSpace: 'nowrap', padding: '12px 10px', verticalAlign: 'middle' }}>Fecha</th>
                                        <th className="p-2" style={{ padding: '12px 10px', verticalAlign: 'middle' }}>Tipo</th>
                                        <th className="p-2" style={{ padding: '12px 10px', verticalAlign: 'middle' }}>Descripción</th>
                                        <th className="text-right p-2" style={{ whiteSpace: 'nowrap', padding: '12px 10px', verticalAlign: 'middle' }}>Monto</th>
                                        <th className="text-right p-2" style={{ whiteSpace: 'nowrap', padding: '12px 10px', verticalAlign: 'middle' }}>Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMovements.map(mov => (
                                        <tr key={mov.id} className="border-b border-gray-800 hover:bg-white/5">
                                            <td className="p-2" style={{ whiteSpace: 'nowrap', padding: '12px 10px', verticalAlign: 'middle' }}>{new Date(mov.created_at).toLocaleString()}</td>
                                            <td className="p-2">
                                                <span className={`px-2 py-1 rounded text-xs ${mov.type === 'SALE' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                                                    {mov.type === 'SALE' ? 'Compra' : 'Pago'}
                                                </span>
                                            </td>
                                            <td className="p-2" style={{ padding: '12px 10px', verticalAlign: 'middle' }}>{mov.description}</td>
                                            <td className={`p-2 text-right ${mov.amount > 0 ? 'text-danger' : 'text-success'}`} style={{ whiteSpace: 'nowrap', padding: '12px 10px', verticalAlign: 'middle' }}>
                                                ${Number(mov.amount).toFixed(2)}
                                            </td>
                                            <td className={`p-2 text-right font-bold ${Number(mov.balance_after) > 0 ? 'text-danger' : 'text-success'}`} style={{ whiteSpace: 'nowrap', padding: '12px 10px', verticalAlign: 'middle' }}>
                                                ${Number(mov.balance_after).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden report-card-grid">
                            {filteredMovements.map(mov => (
                                <div key={mov.id} className="report-card">
                                    <div className="report-card-row">
                                        <div className="report-card-label" style={{ minWidth: '84px' }}>Fecha</div>
                                        <div className="report-card-value" style={{ textAlign: 'right' }}>{new Date(mov.created_at).toLocaleString()}</div>
                                    </div>
                                    <div className="report-card-row">
                                        <div className="report-card-label" style={{ minWidth: '84px' }}>Tipo</div>
                                        <div className="report-card-value" style={{ textAlign: 'right' }}>
                                            <span className={`px-2 py-1 rounded text-xs ${mov.type === 'SALE' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                                                {mov.type === 'SALE' ? 'Compra' : 'Pago'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="report-card-row">
                                        <div className="report-card-label" style={{ minWidth: '84px' }}>Detalle</div>
                                        <div className="report-card-value" style={{ textAlign: 'right' }}>{mov.description}</div>
                                    </div>
                                    <div className="report-card-row">
                                        <div className="report-card-label" style={{ minWidth: '84px' }}>Monto</div>
                                        <div className={`report-card-value ${mov.amount > 0 ? 'text-danger' : 'text-success'}`} style={{ textAlign: 'right' }}>${Number(mov.amount).toFixed(2)}</div>
                                    </div>
                                    <div className="report-card-row">
                                        <div className="report-card-label" style={{ minWidth: '84px' }}>Saldo</div>
                                        <div className={`report-card-value ${Number(mov.balance_after) > 0 ? 'text-danger' : 'text-success'}`} style={{ textAlign: 'right' }}>${Number(mov.balance_after).toFixed(2)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 bg-black/80 flex-center z-50" onMouseDown={() => setShowPayModal(false)}>
                    <div
                        className="glass-panel p-6 animate-fade-in"
                        style={{ width: 'min(520px, calc(100vw - 24px))' }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold">Registrar Pago</h2>
                                <div className="text-secondary" style={{ marginTop: '0.2rem', fontSize: '0.9rem' }}>
                                    Saldo actual: <span className="font-bold">${balance.toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="secondary-btn flex-center"
                                style={{ padding: '0.55rem 0.75rem' }}
                                onClick={() => setShowPayModal(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '0.9rem' }}>
                                <div>
                                    <label className="block text-secondary text-sm mb-1">Monto a pagar</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        max={balance}
                                        value={payment.amount}
                                        onChange={e => setPayment({...payment, amount: e.target.value})}
                                        required
                                        className="input-field w-full"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-secondary text-sm mb-1">Método de Pago</label>
                                    <select 
                                        value={payment.method} 
                                        onChange={e => setPayment({...payment, method: e.target.value})}
                                        className="input-field w-full"
                                        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                                    >
                                        <option>Efectivo</option>
                                        <option>Debito</option>
                                        <option>Transferencia</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4" style={{ marginTop: '1rem' }}>
                                <label className="block text-secondary text-sm" style={{ marginBottom: '0.5rem' }}>Notas</label>
                                <textarea 
                                    value={payment.notes} 
                                    onChange={e => setPayment({...payment, notes: e.target.value})}
                                    className="input-field w-full"
                                    rows="3"
                                    placeholder="Opcional"
                                    style={{
                                        padding: '10px 12px',
                                        resize: 'vertical',
                                        background: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        color: 'white',
                                        minHeight: '90px'
                                    }}
                                />
                            </div>

                            <div className="flex-center" style={{ marginTop: '0.5rem' }}>
                                <div className="flex gap-4" style={{ justifyContent: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '420px' }}>
                                    <button type="button" className="secondary-btn" style={{ minWidth: '160px' }} onClick={() => setShowPayModal(false)}>Cancelar</button>
                                    <button type="submit" className="primary-btn" style={{ minWidth: '160px' }}>Confirmar</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetails;
