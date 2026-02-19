import React, { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, getCategories } from '../services/api';
import { FaEdit, FaPlus, FaSearch, FaTimes, FaDrumstickBite } from 'react-icons/fa';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form inputs
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category_id: '',
        stock: '',
        unit: 'UNIT',
    });

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data } = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Error loading products", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const { data } = await getCategories();
            const active = Array.isArray(data) ? data.filter(c => c.is_active) : [];
            setCategories(active);

            // Default select when creating a new product
            if (active.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    category_id: prev.category_id ? prev.category_id : String(active[0].id)
                }));
            }
        } catch (error) {
            console.error('Error loading categories', error);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price,
                category_id: product.category_id ? String(product.category_id) : '',
                stock: product.stock || 0,
                unit: product.unit || 'UNIT',
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: '',
                category_id: categories.length > 0 ? String(categories[0].id) : '',
                stock: '',
                unit: 'UNIT',
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
            } else {
                await createProduct(formData);
            }
            setShowModal(false);
            loadProducts();
        } catch (error) {
            console.error("Error saving product", error);
            alert("Error al guardar producto");
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        String(p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="flex-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Gestión de Productos</h1>
                    <p className="text-secondary">Administra el inventario y precios</p>
                </div>
                <button className="primary-btn flex-center gap-2" onClick={() => handleOpenModal()}>
                    <FaPlus /> Nuevo Producto
                </button>
            </div>

            <div className="glass-panel p-4 mb-6">
                <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                    <FaSearch className="text-secondary" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o categoría..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', width: '100%', outline: 'none', color: 'white' }}
                    />
                </div>
            </div>

            <div className="table-container glass-panel">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4">Precio</th>
                            <th className="p-4">Unidad</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="p-4 text-center">Cargando...</td></tr>
                        ) : filteredProducts.map(product => (
                            <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="p-4 font-bold flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                        <FaDrumstickBite color="var(--accent-color)" />
                                    </div>
                                    {product.name}
                                </td>
                                <td className="p-4"><span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>{product.category}</span></td>
                                <td className="p-4 text-accent font-bold">${product.price}</td>
                                <td className="p-4">{product.unit || 'UNIT'}</td>
                                <td className="p-4">{product.stock || 0}</td>
                                <td className="p-4">
                                    <button onClick={() => handleOpenModal(product)} className="secondary-btn" style={{ padding: '8px' }}>
                                        <FaEdit />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000 }} className="flex-center animate-fade-in">
                    <div className="glass-panel p-6 modal-card" style={{ background: '#1e293b' }}>
                        <div className="flex-between mb-6">
                            <h2 className="text-xl font-bold">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-secondary hover:text-white"><FaTimes /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="flex-col gap-4">
                            <div>
                                <label className="block text-secondary mb-1">Nombre</label>
                                <input 
                                    className="input-field w-full p-2 glass-panel"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="block text-secondary mb-1">Precio ($)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        className="input-field w-full p-2 glass-panel"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        required
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-secondary mb-1">Stock Inicial</label>
                                    <input 
                                        type="number"
                                        className="input-field w-full p-2 glass-panel"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-secondary mb-1">Categoría</label>
                                <select 
                                    className="input-field w-full p-2 glass-panel"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                    style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                                >
                                    {categories.length > 0 ? (
                                        categories.map(c => (
                                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                                        ))
                                    ) : (
                                        <option value="">Pollo</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-secondary mb-1">Unidad de medida</label>
                                <select
                                    className="input-field w-full p-2 glass-panel"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                                >
                                    <option value="UNIT">Unidad</option>
                                    <option value="KG">Kg</option>
                                </select>
                            </div>

                            <div className="flex-end gap-3 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="secondary-btn">Cancelar</button>
                                <button type="submit" className="primary-btn">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
