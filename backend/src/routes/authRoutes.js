const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '8h' }
        );

        // Audit Login
        await db.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [user.id, 'LOGIN', JSON.stringify({ ip: req.ip })]
        );

        res.json({ token, role: user.role, username: user.username });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
