const db = require('../config/db');

exports.getAuditLogs = async (req, res) => {
    try {
        const { action, entity_id, user_id, from, to, limit } = req.query;

        const where = [];
        const params = [];

        if (action) {
            params.push(action);
            where.push(`al.action = $${params.length}`);
        }

        if (entity_id) {
            params.push(parseInt(entity_id, 10));
            where.push(`al.entity_id = $${params.length}`);
        }

        if (user_id) {
            params.push(parseInt(user_id, 10));
            where.push(`al.user_id = $${params.length}`);
        }

        if (from) {
            params.push(from);
            where.push(`al.created_at >= $${params.length}`);
        }

        if (to) {
            params.push(to);
            where.push(`al.created_at <= $${params.length}`);
        }

        const limitVal = Math.min(parseInt(limit || '100', 10) || 100, 500);
        params.push(limitVal);

        const sql = `
            SELECT al.*, u.username
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            ORDER BY al.id DESC
            LIMIT $${params.length}
        `;

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
