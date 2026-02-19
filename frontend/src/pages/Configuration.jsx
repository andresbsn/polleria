import React, { useEffect, useMemo, useState } from 'react';
import { createCategory, createUser, getCategories, listUsers, setCategoryActive } from '../services/api';

const Configuration = () => {
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
    const [newCategoryName, setNewCategoryName] = useState('');

    const activeCategories = useMemo(
        () => categories.filter(c => c.is_active),
        [categories]
    );

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const { data } = await listUsers();
            setUsers(data);
        } catch (e) {
            alert('Error cargando usuarios');
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadCategories = async () => {
        setLoadingCategories(true);
        try {
            const { data } = await getCategories();
            setCategories(data);
        } catch (e) {
            alert('Error cargando categorías');
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        loadUsers();
        loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await createUser(newUser);
            setNewUser({ username: '', password: '', role: 'user' });
            loadUsers();
        } catch (e2) {
            alert(e2.response?.data?.error || 'Error creando usuario');
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await createCategory({ name: newCategoryName });
            setNewCategoryName('');
            loadCategories();
        } catch (e2) {
            alert(e2.response?.data?.error || 'Error creando categoría');
        }
    };

    const toggleCategory = async (cat) => {
        try {
            await setCategoryActive(cat.id, { is_active: !cat.is_active });
            loadCategories();
        } catch (e) {
            alert(e.response?.data?.error || 'Error actualizando categoría');
        }
    };

    return (
        <div className="page-container">
            <div className="flex-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Configuración</h1>
                    <p className="text-secondary">Administración de usuarios y categorías</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-panel p-4">
                    <div className="flex-between mb-4">
                        <h2 className="text-xl font-bold">Usuarios</h2>
                        <button className="secondary-btn" onClick={loadUsers} disabled={loadingUsers}>
                            {loadingUsers ? '...' : 'Actualizar'}
                        </button>
                    </div>

                    <form onSubmit={handleCreateUser} className="flex-col gap-3" style={{ marginBottom: '1rem' }}>
                        <input
                            className="input-field w-full p-2"
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                            placeholder="Username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            className="input-field w-full p-2"
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                            placeholder="Password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            required
                        />
                        <select
                            className="input-field w-full p-2"
                            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="superadmin">superadmin</option>
                        </select>
                        <button className="primary-btn" type="submit">Crear Usuario</button>
                    </form>

                    <div className="report-card-grid">
                        {users.map(u => (
                            <div key={u.id} className="report-card">
                                <div className="report-card-row">
                                    <div className="report-card-label">Usuario</div>
                                    <div className="report-card-value">{u.username}</div>
                                </div>
                                <div className="report-card-row">
                                    <div className="report-card-label">Rol</div>
                                    <div className="report-card-value">{u.role}</div>
                                </div>
                                <div className="report-card-row">
                                    <div className="report-card-label">Alta</div>
                                    <div className="report-card-value">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</div>
                                </div>
                            </div>
                        ))}
                        {!loadingUsers && users.length === 0 && (
                            <div className="glass-panel p-6 text-center text-secondary">No hay usuarios.</div>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-4">
                    <div className="flex-between mb-4">
                        <h2 className="text-xl font-bold">Categorías</h2>
                        <button className="secondary-btn" onClick={loadCategories} disabled={loadingCategories}>
                            {loadingCategories ? '...' : 'Actualizar'}
                        </button>
                    </div>

                    <form onSubmit={handleCreateCategory} className="flex-col gap-3" style={{ marginBottom: '1rem' }}>
                        <input
                            className="input-field w-full p-2"
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white' }}
                            placeholder="Nueva categoría"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            required
                        />
                        <button className="primary-btn" type="submit">Agregar Categoría</button>
                    </form>

                    <div className="report-card-grid">
                        {categories.map(c => (
                            <div key={c.id} className="report-card">
                                <div className="report-card-row">
                                    <div className="report-card-label">Nombre</div>
                                    <div className="report-card-value">{c.name}</div>
                                </div>
                                <div className="report-card-row">
                                    <div className="report-card-label">Estado</div>
                                    <div className="report-card-value">{c.is_active ? 'Activa' : 'Inactiva'}</div>
                                </div>
                                <div className="report-card-row">
                                    <div className="report-card-label">Acción</div>
                                    <div className="report-card-value">
                                        <button
                                            type="button"
                                            className={c.is_active ? 'secondary-btn' : 'primary-btn'}
                                            onClick={() => toggleCategory(c)}
                                            style={{ padding: '0.4rem 0.7rem', fontSize: '0.85rem' }}
                                        >
                                            {c.is_active ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!loadingCategories && categories.length === 0 && (
                            <div className="glass-panel p-6 text-center text-secondary">No hay categorías.</div>
                        )}
                    </div>

                    {activeCategories.length > 0 && (
                        <div className="text-secondary" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                            Activas: {activeCategories.map(c => c.name).join(', ')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Configuration;
