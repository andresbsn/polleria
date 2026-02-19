import React, { useState, useEffect } from 'react';
import { getProducts, updateProduct } from '../services/api';
import { FaBoxOpen, FaSave, FaSync, FaSearch } from 'react-icons/fa';

const Stock = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stockChanges, setStockChanges] = useState({}); // Stores { id: newStockValue }

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data } = await getProducts();
            setProducts(data);
            setStockChanges({}); // Reset changes on reload
        } catch (error) {
            console.error("Error loading products", error);
        } finally {
            setLoading(false);
        }
    };

    const getQtyStep = (unit) => (unit === 'KG' ? 0.1 : 1);

    const normalizeQty = (unit, value) => {
        const step = getQtyStep(unit);
        let n = typeof value === 'number' ? value : parseFloat(value);
        if (Number.isNaN(n) || n < 0) n = 0;

        if (unit === 'KG') {
            n = Math.round(n / step) * step;
            return Number(n.toFixed(2));
        }

        return Math.round(n);
    };

    const handleStockChange = (id, unit, newValue) => {
        setStockChanges(prev => ({
            ...prev,
            [id]: normalizeQty(unit || 'UNIT', newValue),
        }));
    };

    const saveChanges = async () => {
        const updates = Object.entries(stockChanges);
        if (updates.length === 0) return;

        setLoading(true);
        try {
            await Promise.all(updates.map(async ([id, newStock]) => {
                const product = products.find(p => p.id === parseInt(id));
                if (product) {
                    await updateProduct(id, { ...product, stock: newStock });
                }
            }));
            alert('Stock actualizado correctamente');
            loadProducts();
        } catch (error) {
            console.error("Error updating stock", error);
            alert("Error al actualizar stock");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="flex-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Control de Stock</h1>
                    <p className="text-secondary">Ajuste rápido de inventario</p>
                </div>
                <div className="flex-center gap-2">
                    <button className="secondary-btn" onClick={loadProducts} disabled={loading}>
                        <FaSync className={loading ? 'spin' : ''} /> Actualizar
                    </button>
                    {Object.keys(stockChanges).length > 0 && (
                        <button className="primary-btn animate-fade-in" onClick={saveChanges} disabled={loading}>
                            <FaSave /> Guardar Cambios ({Object.keys(stockChanges).length})
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-panel p-4 mb-6">
                <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                    <FaSearch className="text-secondary" />
                    <input 
                        type="text" 
                        placeholder="Buscar producto por nombre..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', width: '100%', outline: 'none', color: 'white' }}
                    />
                </div>
            </div>

            <div className="table-container glass-panel p-1" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4">Precio</th>
                            <th className="p-4 text-center">Stock Actual</th>
                            <th className="p-4">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => {
                            const currentStock = stockChanges[product.id] !== undefined ? stockChanges[product.id] : product.stock;
                            const isChanged = stockChanges[product.id] !== undefined;
                            const isLowStock = currentStock < 10; // Example threshold
                            const step = getQtyStep(product.unit);
                            const unitLabel = product.unit === 'KG' ? 'kg' : 'un';

                            return (
                                <tr key={product.id} className="hover-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                    <td className="p-4 font-bold">
                                        {product.name}
                                        {isChanged && <span className="text-secondary text-xs ml-2">(Orig: {product.stock})</span>}
                                    </td>
                                    <td className="p-4">
                                        <span style={{
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '999px',
                                            background: 'rgba(255,255,255,0.08)',
                                            fontSize: '0.8rem',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {product.category || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4">${product.price}</td>
                                    <td className="p-4">
                                        <div className="flex-center gap-2">
                                            <button 
                                                className="secondary-btn flex-center"
                                                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px' }}
                                                onClick={() => handleStockChange(product.id, product.unit, Math.max(0, Number(currentStock) - step))}
                                            >-</button>
                                            <input 
                                                type="number" 
                                                step={product.unit === 'KG' ? '0.1' : '1'}
                                                min="0"
                                                value={currentStock}
                                                onChange={(e) => handleStockChange(product.id, product.unit, e.target.value)}
                                                style={{ 
                                                    width: '90px', 
                                                    textAlign: 'center', 
                                                    padding: '4px',
                                                    fontSize: '1rem',
                                                    fontWeight: 800,
                                                    background: isChanged ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                                                    border: isChanged ? '1px solid var(--accent-color)' : '1px solid transparent',
                                                    color: isChanged ? 'var(--accent-color)' : 'white',
                                                    borderRadius: '8px'
                                                }}
                                            />

                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '10px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                color: 'var(--text-secondary)',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.10)'
                                            }}>
                                                {unitLabel}
                                            </span>
                                            <button 
                                                className="secondary-btn flex-center"
                                                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px' }}
                                                onClick={() => handleStockChange(product.id, product.unit, Number(currentStock) + step)}
                                            >+</button>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {isLowStock ? (
                                            <span style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger-color)' }}></span>
                                                Bajo
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }}></span>
                                                Normal
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Stock;
