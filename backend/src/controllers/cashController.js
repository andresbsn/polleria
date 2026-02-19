const db = require('../config/db');

exports.getCurrentSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            `SELECT id, user_id, opened_at, closed_at, initial_amount, final_amount, total_sales, status
             FROM cash_sessions
             WHERE user_id = $1 AND status = 'OPEN' AND closed_at IS NULL
             ORDER BY opened_at DESC
             LIMIT 1`,
            [userId]
        );

        res.json({ open: result.rows.length > 0, session: result.rows[0] || null });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.openSession = async (req, res) => {
    const { initial_amount } = req.body;
    try {
        const userId = req.user.id;

        const existing = await db.query(
            `SELECT id
             FROM cash_sessions
             WHERE user_id = $1 AND status = 'OPEN' AND closed_at IS NULL
             LIMIT 1`,
            [userId]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Ya existe una caja abierta para este usuario' });
        }

        const initial = initial_amount !== undefined && initial_amount !== null && initial_amount !== ''
            ? parseFloat(initial_amount)
            : 0;

        if (Number.isNaN(initial) || initial < 0) {
            return res.status(400).json({ error: 'Monto inicial inválido' });
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const sessionRes = await client.query(
                `INSERT INTO cash_sessions (user_id, initial_amount, status)
                 VALUES ($1, $2, 'OPEN')
                 RETURNING id, user_id, opened_at, initial_amount, status`,
                [userId, initial]
            );

            const session = sessionRes.rows[0];

            await client.query(
                `INSERT INTO cash_movements (session_id, user_id, type, amount, description)
                 VALUES ($1, $2, 'OPEN', $3, $4)`,
                [session.id, userId, initial, 'Apertura de caja']
            );

            await client.query('COMMIT');
            res.status(201).json({ open: true, session });
        } catch (e2) {
            await client.query('ROLLBACK');
            throw e2;
        } finally {
            client.release();
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.closeSession = async (req, res) => {
    const { final_amount } = req.body;
    try {
        const userId = req.user.id;

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const openRes = await client.query(
                `SELECT id, initial_amount
                 FROM cash_sessions
                 WHERE user_id = $1 AND status = 'OPEN' AND closed_at IS NULL
                 ORDER BY opened_at DESC
                 LIMIT 1
                 FOR UPDATE`,
                [userId]
            );

            if (openRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'No hay caja abierta' });
            }

            const sessionId = openRes.rows[0].id;

            const final = final_amount !== undefined && final_amount !== null && final_amount !== ''
                ? parseFloat(final_amount)
                : null;

            if (final !== null && (Number.isNaN(final) || final < 0)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Monto final inválido' });
            }

            const closeRes = await client.query(
                `UPDATE cash_sessions
                 SET closed_at = NOW(), final_amount = $1, status = 'CLOSED'
                 WHERE id = $2
                 RETURNING id, user_id, opened_at, closed_at, initial_amount, final_amount, total_sales, status`,
                [final, sessionId]
            );

            await client.query(
                `INSERT INTO cash_movements (session_id, user_id, type, amount, description)
                 VALUES ($1, $2, 'CLOSE', $3, $4)`,
                [sessionId, userId, final !== null ? final : 0, 'Cierre de caja']
            );

            await client.query('COMMIT');
            res.json({ open: false, session: closeRes.rows[0] });
        } catch (e2) {
            await client.query('ROLLBACK');
            throw e2;
        } finally {
            client.release();
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getMovements = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10) || 50, 200) : 50;

        const result = await db.query(
            `SELECT cm.*
             FROM cash_movements cm
             WHERE cm.user_id = $1
             ORDER BY cm.id DESC
             LIMIT $2`,
            [userId, limit]
        );

        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
