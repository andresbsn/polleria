import React, { useState, useEffect } from 'react';
import { getProducts, createSale, getClients, getCategories, closeCashSession, getCashCurrent, openCashSession } from '../services/api';
import { FaSearch, FaTrash, FaPlus, FaMinus, FaCheckCircle, FaPrint, FaFileInvoiceDollar, FaDrumstickBite } from 'react-icons/fa';
import Ticket from '../components/Ticket';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [loading, setLoading] = useState(false);

    // Product Categories
    const [productCategories, setProductCategories] = useState([]);
    
    // Clients
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [clientSearch, setClientSearch] = useState('');

    // Checkout Modal State
    const [showModal, setShowModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [shouldInvoice, setShouldInvoice] = useState(false);
    const [clientDoc, setClientDoc] = useState('');
    const [clientName, setClientName] = useState('');
    const [discountPercent, setDiscountPercent] = useState('0');
    const [lastSale, setLastSale] = useState(null);

    // Cash Session
    const [cash, setCash] = useState({ open: false, session: null });
    const [loadingCash, setLoadingCash] = useState(false);
    const [showOpenCashModal, setShowOpenCashModal] = useState(false);
    const [showCloseCashModal, setShowCloseCashModal] = useState(false);
    const [openCashAmount, setOpenCashAmount] = useState('0');
    const [closeCashAmount, setCloseCashAmount] = useState('');

    useEffect(() => {
        loadProducts();
        loadClientsData();
        loadProductCategories();
        loadCashCurrent();
    }, []);

    const loadProducts = async () => {
        try {
            const { data } = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Error loading products", error);
        }
    };

    const loadClientsData = async () => {
        try {
            const { data } = await getClients();
            setClients(data);
        } catch (error) {
            console.error("Error loading clients", error);
        }
    };

    const loadProductCategories = async () => {
        try {
            const { data } = await getCategories();
            const active = Array.isArray(data) ? data.filter(c => c.is_active) : [];
            setProductCategories(active);
        } catch (error) {
            console.error('Error loading categories', error);
        }
    };

    const loadCashCurrent = async () => {
        setLoadingCash(true);
        try {
            const { data } = await getCashCurrent();
            setCash(data);
        } catch (error) {
            console.error('Error loading cash current', error);
            setCash({ open: false, session: null });
        } finally {
            setLoadingCash(false);
        }
    };

    const handleOpenCash = async (e) => {
        e.preventDefault();
        try {
            await openCashSession({ initial_amount: openCashAmount });
            setShowOpenCashModal(false);
            setOpenCashAmount('0');
            loadCashCurrent();
        } catch (err) {
            alert(err.response?.data?.error || 'Error abriendo caja');
        }
    };

    const handleCloseCash = async (e) => {
        e.preventDefault();
        try {
            await closeCashSession({ final_amount: closeCashAmount === '' ? null : closeCashAmount });
            setShowCloseCashModal(false);
            setCloseCashAmount('');
            setCart([]);
            loadCashCurrent();
        } catch (err) {
            alert(err.response?.data?.error || 'Error cerrando caja');
        }
    };

    const getQtyStep = (unit) => (unit === 'KG' ? 0.1 : 1);
    const getQtyButtonStep = (unit) => 1;

    const addToCart = (product) => {
        if (!cash.open) {
            alert('Caja cerrada. Debe abrir caja para operar.');
            return;
        }
        const existing = cart.find(item => item.product_id === product.id);
        const unit = product.unit || 'UNIT';
        const stepButtons = getQtyButtonStep(unit);
        if (existing) {
            setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: parseFloat(item.quantity) + stepButtons } : item));
        } else {
            setCart([...cart, { product_id: product.id, name: product.name, price: Number(product.price), quantity: 1, unit }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.product_id !== id));
    };

    const updateQuantity = (id, newQuantity) => {
        const cartItem = cart.find(i => i.product_id === id);
        const unit = cartItem?.unit || 'UNIT';
        const step = getQtyStep(unit);
        let qty = parseFloat(newQuantity);
        if (isNaN(qty) || qty < 0) return; 

        if (unit !== 'KG') {
            qty = Math.round(qty);
        } else {
            qty = Math.round(qty / step) * step;
            qty = Number(qty.toFixed(1));
            if (qty > 0 && qty < step) qty = step;
        }
        
        setCart(cart.map(item => 
            item.product_id === id ? { ...item, quantity: qty } : item 
        ));
    };

    // Calculate total carefully ensuring quantity is treated as number
    const total = cart.reduce((sum, item) => sum + (item.price * (parseFloat(item.quantity) || 0)), 0);
    const discountPctVal = (() => {
        const n = parseFloat(discountPercent);
        if (Number.isNaN(n) || n < 0) return 0;
        return Math.min(n, 100);
    })();
    const discountVal = (total * discountPctVal) / 100;
    const totalFinal = Math.max(0, total - discountVal);

    const handleClientSelect = (e) => {
        const cId = e.target.value;
        setSelectedClient(cId);
        if (cId) {
            const client = clients.find(c => c.id == cId);
            if (client) {
                setClientName(client.name);
                setClientDoc(client.tax_id || '');
            }
        } else {
            setClientName('');
            setClientDoc('');
        }
    };

    const handleCheckout = async () => {
        if (!cash.open) {
            alert('Caja cerrada. Debe abrir caja para operar.');
            return;
        }
        if (paymentMethod === 'Cuenta Corriente' && !selectedClient) {
            alert("Debe seleccionar un cliente para Cuenta Corriente");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                items: cart.map(i => ({...i, quantity: parseFloat(i.quantity)})), // Ensure float is sent
                payment_method: paymentMethod,
                client_name: clientName || 'Consumidor Final',
                should_invoice: shouldInvoice,
                client_doc_nro: clientDoc ? parseInt(clientDoc) : 0,
                client_doc_tipo: clientDoc ? 80 : 99, // 80=CUIT if entered
                client_id: selectedClient || null,
                discount_percent: discountPctVal
            };
            const { data } = await createSale(payload);

            setLastSale(data);
            setCart([]);
            setShowModal(false);
            // Reset modal state
            setClientName('');
            setClientDoc('');
            setSelectedClient('');
            setClientSearch('');
            setPaymentMethod('Efectivo');
            setDiscountPercent('0');

            // Refresh cash totals
            loadCashCurrent();
        } catch (error) {
            console.error("Checkout failed", error);
            alert("Error: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = (() => {
        const q = clientSearch.trim().toLowerCase();
        if (!q) return clients;
        return clients.filter(c => {
            const name = String(c.name || '').toLowerCase();
            const tax = String(c.tax_id || '').toLowerCase();
            return name.includes(q) || tax.includes(q);
        });
    })();

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All'
            ? true
            : String(p.category_id || '') === String(categoryFilter);
        return matchesSearch && matchesCategory;
    });

    const categories = [{ id: 'All', name: 'All' }, ...productCategories.map(c => ({ id: String(c.id), name: c.name }))];

    const componentRef = React.useRef();

    const handlePrint = () => {
        // Create a printable area manually if not using a library
        const content = componentRef.current;
        if (!content) return;
        
        // Simple window print trick: 
        // We moved css logic to @media print to hide everything but .printable-area
        // We just need to wrap our Ticket in a div with that class
        window.print();
    };

    if (lastSale) {
        // Construct sale object for ticket if it was partial
        // The backend now returns { sale: {...}, invoice: ...} which includes items.
        // POS sets lastSale = response.data (which has sale, invoice, message).
        // So we need to pass lastSale.sale (which has items) + lastSale.invoice details
        
        const saleForTicket = {
            ...lastSale.sale,
            // Add invoice details if present
            cae: lastSale.invoice?.cae,
            cae_expiration: lastSale.invoice?.cae_expiration,
            cbte_nro: lastSale.invoice?.cbte_nro,
            pto_vta: lastSale.invoice?.pto_vta,
            cbte_tipo: lastSale.invoice?.cbte_tipo,
            // For now, if invoice is approved, we assume it's good. 
            // The backend createSale response for invoice might simply return status/cae.
            // Let's ensure we map what we have.
            invoice_status: lastSale.invoice?.status
        };

        return (
            <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-panel p-6" style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <FaCheckCircle size={60} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
                    <h2 className="text-xl mb-4">Venta Exitosa!</h2>
                    <p className="text-secondary mb-4">ID Venta: #{lastSale.sale_id}</p>
                    {lastSale.invoice && (
                        <div className="mb-4 p-4" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <p className="font-bold">Factura AFIP</p>
                            <p>CAE: {lastSale.invoice.cae || 'Pendiente'}</p>
                            <p>Estado: <span style={{ color: lastSale.invoice.status === 'APPROVED' ? 'var(--success-color)' : 'var(--danger-color)' }}>{lastSale.invoice.status}</span></p>
                        </div>
                    )}
                    <button className="primary-btn w-full" onClick={() => setLastSale(null)}>Nueva Venta</button>
                    <button className="secondary-btn w-full mt-2" onClick={handlePrint}><FaPrint /> Imprimir Ticket</button>
                </div>

                {/* Ticket Container for Printing - Visible only in print layout */}
                <div className="visible-print" style={{ display: 'none' }}>
                    <div className="printable-area" ref={componentRef}>
                        <Ticket sale={saleForTicket} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pos-layout">

            {/* Cash Session Bar */}
            <div className="glass-panel p-4" style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
                <div className="flex-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <div className="text-secondary" style={{ fontSize: '0.9rem' }}>Caja</div>
                        {loadingCash ? (
                            <div className="text-secondary">Cargando estado...</div>
                        ) : cash.open ? (
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="text-success font-bold">Abierta</span>
                                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                                    Apertura: {cash.session?.opened_at ? new Date(cash.session.opened_at).toLocaleString() : '-'}
                                </span>
                                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                                    Inicial: ${Number(cash.session?.initial_amount || 0).toFixed(2)}
                                </span>
                                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                                    Ventas: ${Number(cash.session?.total_sales || 0).toFixed(2)}
                                </span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="text-danger font-bold">Cerrada</span>
                                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>Debe abrir caja para operar.</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-center" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className={cash.open ? 'secondary-btn' : 'primary-btn'}
                            onClick={() => setShowOpenCashModal(true)}
                            disabled={loadingCash || cash.open}
                        >
                            Abrir Caja
                        </button>
                        <button
                            type="button"
                            className={cash.open ? 'primary-btn' : 'secondary-btn'}
                            onClick={() => setShowCloseCashModal(true)}
                            disabled={loadingCash || !cash.open}
                        >
                            Cerrar Caja
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Left: Products */}
            <div className="flex-col" style={{ gap: '1rem', overflow: 'hidden' }}>
                <div className="flex-between glass-panel p-4">
                    <div className="flex-center gap-2">
                        <FaSearch className="text-secondary" />
                        <input 
                            type="text" 
                            placeholder="Buscar productos..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '250px', border: 'none', background: 'transparent', padding: '0.5rem' }} 
                        />
                    </div>
                    <div className="flex-center gap-2">
                        {categories.map(cat => (
                            <button 
                                key={cat.id} 
                                onClick={() => setCategoryFilter(cat.id)}
                                className={categoryFilter === cat.id ? 'primary-btn' : 'secondary-btn'}
                                style={{ padding: '0.3rem 1rem', fontSize: '0.9rem' }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem', overflowY: 'auto', paddingBottom: '2rem', paddingRight: '1rem' }}>
                    {filteredProducts.map(product => (
                        <div 
                            key={product.id} 
                            className="product-card"
                            onClick={() => addToCart(product)}
                        >
                            <div className="product-icon">
                                <FaDrumstickBite />
                            </div>
                            <div style={{ textAlign: 'center', width: '100%', zIndex: 1 }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'white' }}>{product.name}</h3>
                                <p className="text-secondary" style={{ fontSize: '0.95rem' }}>${product.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart */}
            <div className="glass-panel flex-col" style={{ height: '100%', overflow: 'hidden' }}>
                <div className="p-4" style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="flex-between mb-6">
                        <h2 className="text-2xl font-bold">Ticket Actual</h2>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.2rem 0.8rem', borderRadius: '20px', color: 'var(--accent-color)', fontSize: '0.8rem', fontWeight: '600' }}>
                            {cart.length} ítems
                        </div>
                    </div>
                    
                    {cart.length === 0 ? (
                        <div className="flex-center h-full text-secondary" style={{ height: '200px', flexDirection: 'column', opacity: 0.5 }}>
                            <FaDrumstickBite size={40} style={{ marginBottom: '1rem' }} />
                            <p>Seleccione productos</p>
                        </div>
                    ) : (
                        <div className="flex-col gap-2">
                            {cart.map((item, idx) => (
                                <div key={idx} className="cart-item flex-between p-4">
                                    <div style={{ flex: 1 }}>
                                        <p className="font-bold mb-1">{item.name}</p>
                                        <div className="flex-center mt-2" style={{ justifyContent: 'flex-start' }}>
                                            <div className="flex-center" style={{ 
                                                background: 'rgba(0,0,0,0.3)', 
                                                borderRadius: '8px', 
                                                border: '1px solid var(--text-secondary)' 
                                            }}>
                                                <button 
                                                    className="flex-center hover-bg"
                                                    style={{ 
                                                        padding: '0', 
                                                        width: '32px',
                                                        height: '32px',
                                                        color: 'var(--text-primary)',
                                                        background: 'transparent',
                                                        borderRight: '1px solid var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        borderRadius: '8px 0 0 8px'
                                                    }}
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        const step = getQtyButtonStep(item.unit);
                                                        const newVal = parseFloat(item.quantity) - step;
                                                        if (newVal > 0) updateQuantity(item.product_id, newVal);
                                                    }}
                                                >
                                                    <FaMinus size={10} />
                                                </button>
                                                <input 
                                                    type="number" 
                                                    step={item.unit === 'KG' ? '0.1' : '1'} 
                                                    min="0"
                                                    inputMode={item.unit === 'KG' ? 'decimal' : 'numeric'}
                                                    pattern={item.unit === 'KG' ? undefined : "[0-9]*"}
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ 
                                                        width: '50px', 
                                                        padding: '0', 
                                                        fontSize: '0.9rem', 
                                                        textAlign: 'center',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--text-primary)',
                                                        outline: 'none',
                                                        height: '32px'
                                                    }}
                                                />
                                                <button 
                                                    className="flex-center hover-bg"
                                                    style={{ 
                                                        padding: '0',
                                                        width: '32px',
                                                        height: '32px',
                                                        color: 'var(--text-primary)',
                                                        background: 'transparent',
                                                        borderLeft: '1px solid var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        borderRadius: '0 8px 8px 0'
                                                    }}
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        const step = getQtyButtonStep(item.unit);
                                                        updateQuantity(item.product_id, parseFloat(item.quantity) + step);
                                                    }}
                                                >
                                                    <FaPlus size={10} />
                                                </button>
                                            </div>
                                            <span className="text-secondary" style={{ fontSize: '0.9rem', marginLeft: '10px' }}>x ${item.price} {item.unit === 'KG' ? '/kg' : ''}</span>
                                        </div>
                                    </div>
                                    <div className="flex-center gap-2">
                                        <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                                        <button 
                                            className="flex-center"
                                            style={{ 
                                                padding: '8px', 
                                                background: 'rgba(239, 68, 68, 0.1)', 
                                                borderRadius: '8px',
                                                border: '1px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.product_id); }}
                                            onMouseOver={(e) => e.currentTarget.style.border = '1px solid var(--danger-color)'}
                                            onMouseOut={(e) => e.currentTarget.style.border = '1px solid transparent'}
                                        >
                                            <FaTrash color="var(--danger-color)" size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6" style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex-between mb-4">
                        <span className="text-secondary">Subtotal</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    {discountVal > 0 && (
                        <div className="flex-between mb-4">
                            <span className="text-secondary">Descuento</span>
                            <span className="text-secondary">-{discountPctVal.toFixed(2)}% (${discountVal.toFixed(2)})</span>
                        </div>
                    )}
                    <div className="flex-between mb-4">
                        <span className="text-xl font-bold">Total</span>
                        <span className="text-2xl font-bold text-accent">${totalFinal.toFixed(2)}</span>
                    </div>
                    <button 
                        className="primary-btn w-full" 
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        disabled={cart.length === 0 || !cash.open}
                        onClick={() => {
                            if (!cash.open) {
                                alert('Caja cerrada. Debe abrir caja para operar.');
                                return;
                            }
                            setShowModal(true);
                        }}
                    >
                        Cobrar
                    </button>
                </div>
            </div>

            {/* Open Cash Modal */}
            {showOpenCashModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2100 }} className="flex-center animate-fade-in" onMouseDown={() => setShowOpenCashModal(false)}>
                    <div className="glass-panel p-6" style={{ width: 'min(520px, calc(100vw - 24px))', background: '#1e293b' }} onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="text-xl mb-4">Abrir Caja</h2>
                        <form onSubmit={handleOpenCash}>
                            <div className="mb-4">
                                <label className="block text-secondary mb-2">Monto inicial</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="input-field w-full"
                                    value={openCashAmount}
                                    onChange={(e) => setOpenCashAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex-center gap-4 mt-6">
                                <button type="button" className="secondary-btn flex-1" onClick={() => setShowOpenCashModal(false)}>Cancelar</button>
                                <button type="submit" className="primary-btn flex-1">Confirmar Apertura</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Close Cash Modal */}
            {showCloseCashModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2100 }} className="flex-center animate-fade-in" onMouseDown={() => setShowCloseCashModal(false)}>
                    <div className="glass-panel p-6" style={{ width: 'min(520px, calc(100vw - 24px))', background: '#1e293b' }} onMouseDown={(e) => e.stopPropagation()}>
                        <h2 className="text-xl mb-2">Cerrar Caja</h2>
                        <div className="text-secondary" style={{ marginBottom: '1rem' }}>
                            Ventas registradas: <span className="font-bold">${Number(cash.session?.total_sales || 0).toFixed(2)}</span>
                        </div>
                        <form onSubmit={handleCloseCash}>
                            <div className="mb-4">
                                <label className="block text-secondary mb-2">Monto final (opcional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="input-field w-full"
                                    value={closeCashAmount}
                                    onChange={(e) => setCloseCashAmount(e.target.value)}
                                    placeholder="Dejar vacío si no se contabiliza"
                                    autoFocus
                                />
                            </div>

                            <div className="flex-center gap-4 mt-6">
                                <button type="button" className="secondary-btn flex-1" onClick={() => setShowCloseCashModal(false)}>Cancelar</button>
                                <button type="submit" className="primary-btn flex-1">Confirmar Cierre</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000 }} className="flex-center animate-fade-in">
                    <div className="glass-panel p-6" style={{ width: '400px', background: '#1e293b' }}>
                        <h2 className="text-xl mb-4">Confirmar Venta</h2>
                        
                        <div className="mb-4">
                            <label className="block text-secondary mb-2">Medio de Pago</label>
                            <div className="flex flex-wrap gap-2">
                                {['Efectivo', 'Debito', 'Credito', 'MP', 'Cuenta Corriente'].map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => {
                                            setPaymentMethod(m);
                                            if (m !== 'Efectivo') setDiscountPercent('0');
                                        }}
                                        className={paymentMethod === m ? 'primary-btn' : 'secondary-btn'}
                                        style={{ flex: '1 0 30%', padding: '0.5rem', fontSize: '0.8rem' }}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'Efectivo' && (
                            <div className="mb-4">
                                <label className="block text-secondary mb-2">Bonificación / Descuento (%)</label>
                                <div className="flex-between" style={{ gap: '0.75rem' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="input-field w-full"
                                        value={discountPercent}
                                        onChange={(e) => setDiscountPercent(e.target.value)}
                                        placeholder="0"
                                    />
                                    <div className="text-secondary" style={{ whiteSpace: 'nowrap' }}>
                                        Total: ${totalFinal.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Client Selector */}
                        <div className="mb-4">
                            <label className="block text-secondary mb-2">Cliente Registrado</label>

                            {paymentMethod === 'Cuenta Corriente' && (
                                <input
                                    className="input-field w-full"
                                    placeholder="Buscar por nombre o CUIT/DNI..."
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    style={{ marginBottom: '0.5rem' }}
                                />
                            )}

                            <select 
                                className="input-field w-full"
                                value={selectedClient}
                                onChange={handleClientSelect}
                            >
                                <option value="">Consumidor Final / Sin Cuenta</option>
                                {filteredClients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.tax_id ? `(${c.tax_id})` : ''} - Saldo: ${c.current_account_balance}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4 p-4" style={{ border: '1px solid var(--accent-color)', borderRadius: '8px' }}>
                            <div className="flex-between">
                                <label>Emitir Factura AFIP?</label>
                                <input 
                                    type="checkbox" 
                                    checked={shouldInvoice} 
                                    onChange={(e) => setShouldInvoice(e.target.checked)}
                                    style={{ width: '20px', height: '20px' }}
                                />
                            </div>
                            
                            {shouldInvoice && (
                                <div className="mt-4 animate-fade-in">
                                    <input 
                                        placeholder="CUIT Cliente (Opcional)" 
                                        className="mb-2 input-field w-full"
                                        value={clientDoc}
                                        onChange={(e) => setClientDoc(e.target.value)}
                                    />
                                    <input 
                                        placeholder="Nombre / Razón Social" 
                                        className="mb-2 input-field w-full"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                    />
                                    <small className="text-secondary">Si se deja vacío, se emite a Consumidor Final.</small>
                                </div>
                            )}
                        </div>

                        <div className="flex-center gap-4 mt-6">
                            <button className="secondary-btn flex-1" onClick={() => { setShowModal(false); setClientSearch(''); }}>Cancelar</button>
                            <button className="primary-btn flex-1" onClick={handleCheckout} disabled={loading}>
                                {loading ? 'Procesando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default POS;
