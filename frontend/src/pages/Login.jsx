import React, { useState } from 'react';
import { login } from '../services/api';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await login(username, password);
            onLogin(data);
        } catch (err) {
            console.error(err);
            setError('Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)' }}>
            <div className="glass-panel p-6 animate-fade-in" style={{ width: '380px', borderTop: '4px solid var(--accent-color)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pollería Login</h1>
                    <p className="text-secondary text-sm mt-2">Ingrese sus credenciales para continuar</p>
                </div>
                
                {error && (
                    <div className="p-3 mb-4 text-center rounded text-sm font-medium" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div>
                        <label className="text-secondary text-sm mb-2 block font-medium">Usuario</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Ingrese usuario"
                            style={{ background: 'rgba(15, 23, 42, 0.5)' }}
                        />
                    </div>
                    <div>
                        <label className="text-secondary text-sm mb-2 block font-medium">Contraseña</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{ background: 'rgba(15, 23, 42, 0.5)' }}
                        />
                    </div>
                    <button className="primary-btn mt-4 w-full" disabled={loading} style={{ width: '100%', padding: '1rem' }}>
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                {/* <div className="mt-6 text-center text-xs text-secondary p-4 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="mb-2 font-medium">Usuarios de prueba:</p>
                    <div className="flex-center gap-4">
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>admin / admin123</span>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>cajero / cajero123</span>
                    </div>
                </div> */}
            </div>
        </div>
    );
};

export default Login;
