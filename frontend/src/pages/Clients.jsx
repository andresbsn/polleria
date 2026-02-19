import React, { useState, useEffect } from 'react';
import { getClients, createClient } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaUser } from 'react-icons/fa';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', phone: '', address: '', tax_id: '', tax_type: 'DNI', email: '' });
    
    const navigate = useNavigate();

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const { data } = await getClients();
            setClients(data);
            setFilteredClients(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const results = clients.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (c.tax_id && c.tax_id.includes(searchTerm))
        );
        setFilteredClients(results);
    }, [searchTerm, clients]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createClient(newClient);
            setShowModal(false);
            setNewClient({ name: '', phone: '', address: '', tax_id: '', tax_type: 'DNI', email: '' });
            loadClients();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="page-container">
            <div className="flex-between mb-6">
                <h1 className="text-3xl font-bold">Clientes</h1>
                <button className="primary-btn flex-center gap-2" onClick={() => setShowModal(true)}>
                    <FaPlus /> Nuevo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="glass-panel p-4 mb-6 flex-center justify-start gap-4">
                <FaSearch className="text-secondary" />
                <input 
                    type="text" 
                    placeholder="Buscar por Nombre o DNI..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', width: '100%', maxWidth: '420px', color: 'white' }}
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map(client => (
                    <div 
                        key={client.id} 
                        className="glass-panel p-4 cursor-pointer hover:bg-white/5 transition-all"
                        onClick={() => navigate(`/clients/${client.id}`)}
                    >
                        <div className="flex-between mb-2">
                            <h2 className="font-bold text-lg flex items-center gap-2 flex-1 min-w-0">
                                <FaUser className="text-accent shrink-0" />
                                <span className="truncate" title={client.name}>{client.name}</span>
                            </h2>
                            <span className={(client.current_account_balance > 0 ? 'text-danger font-bold' : 'text-success font-bold') + ' shrink-0'}>
                                ${Number(client.current_account_balance).toFixed(2)}
                            </span>
                        </div>
                        <p className="text-secondary text-sm">{client.phone || 'Sin teléfono'}</p>
                        <p className="text-secondary text-sm">{client.tax_type}: {client.tax_id || '-'}</p>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex-center z-50">
                    <div className="glass-panel p-6 w-[500px] animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">Nuevo Cliente</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input 
                                placeholder="Nombre Completo *" 
                                value={newClient.name}
                                onChange={e => setNewClient({...newClient, name: e.target.value})}
                                required
                                className="input-field"
                            />
                            <div className="flex gap-2">
                                <select 
                                    className="input-field w-24"
                                    value={newClient.tax_type} 
                                    onChange={e => setNewClient({...newClient, tax_type: e.target.value})}
                                >
                                    <option>DNI</option>
                                    <option>CUIT</option>
                                    <option>CUIL</option>
                                </select>
                                <input 
                                    placeholder="Número Documento" 
                                    value={newClient.tax_id}
                                    onChange={e => setNewClient({...newClient, tax_id: e.target.value})}
                                    className="input-field flex-1"
                                />
                            </div>
                            <input 
                                placeholder="Teléfono" 
                                value={newClient.phone}
                                onChange={e => setNewClient({...newClient, phone: e.target.value})}
                                className="input-field"
                            />
                            <input 
                                placeholder="Dirección" 
                                value={newClient.address}
                                onChange={e => setNewClient({...newClient, address: e.target.value})}
                                className="input-field"
                            />
                            <input 
                                placeholder="Email" 
                                value={newClient.email}
                                onChange={e => setNewClient({...newClient, email: e.target.value})}
                                className="input-field"
                            />
                            <div className="flex gap-4 mt-4">
                                <button type="button" className="secondary-btn flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="primary-btn flex-1">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
