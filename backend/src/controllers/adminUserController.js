const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.listUsers = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, role, created_at FROM users ORDER BY id ASC'
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const u = username ? String(username).trim() : '';
        const p = password ? String(password) : '';
        const r = role ? String(role).trim() : 'user';

        if (!u) return res.status(400).json({ error: 'Username requerido' });
        if (!p || p.length < 4) return res.status(400).json({ error: 'Password inválido' });
        if (!['user', 'admin', 'superadmin'].includes(r)) return res.status(400).json({ error: 'Rol inválido' });

        const hash = await bcrypt.hash(p, 10);

        const result = await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
            [u, hash, r]
        );

        res.status(201).json(result.rows[0]);
    } catch (e) {
        if (String(e.message || '').toLowerCase().includes('duplicate')) {
            return res.status(409).json({ error: 'Usuario ya existe' });
        }
        res.status(500).json({ error: e.message });
    }
};
