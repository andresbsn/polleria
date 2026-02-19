const db = require('../config/db');

const requireOpenCashSession = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await db.query(
            `SELECT id, opened_at, initial_amount, status
             FROM cash_sessions
             WHERE user_id = $1 AND status = 'OPEN' AND closed_at IS NULL
             ORDER BY opened_at DESC
             LIMIT 1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Caja cerrada. Debe abrir caja para operar.' });
        }

        req.cashSession = result.rows[0];
        next();
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

module.exports = { requireOpenCashSession };
