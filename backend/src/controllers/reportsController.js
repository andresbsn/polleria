const db = require('../config/db');

const parseLimit = (val, max) => {
    const n = parseInt(val, 10);
    if (!n || n <= 0) return null;
    return Math.min(n, max);
};

exports.getSalesSummaryByDay = async (req, res) => {
    try {
        const { from, to } = req.query;
        const params = [];
        const where = [];

        if (from) {
            params.push(from);
            where.push(`s.created_at >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            where.push(`s.created_at <= $${params.length}`);
        }

        const sql = `
            SELECT
                DATE(s.created_at) as day,
                COUNT(*)::int as sales_count,
                COALESCE(SUM(s.total), 0)::numeric(12,2) as total_amount
            FROM sales s
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            GROUP BY DATE(s.created_at)
            ORDER BY day DESC
        `;

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getSalesByPaymentMethod = async (req, res) => {
    try {
        const { from, to } = req.query;
        const params = [];
        const where = [];

        if (from) {
            params.push(from);
            where.push(`s.created_at >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            where.push(`s.created_at <= $${params.length}`);
        }

        const sql = `
            SELECT
                COALESCE(s.payment_method, 'Sin especificar') as payment_method,
                COUNT(*)::int as sales_count,
                COALESCE(SUM(s.total), 0)::numeric(12,2) as total_amount
            FROM sales s
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            GROUP BY COALESCE(s.payment_method, 'Sin especificar')
            ORDER BY total_amount DESC
        `;

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getTopProducts = async (req, res) => {
    try {
        const { from, to, limit } = req.query;
        const params = [];
        const where = [];

        if (from) {
            params.push(from);
            where.push(`s.created_at >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            where.push(`s.created_at <= $${params.length}`);
        }

        const limitVal = parseLimit(limit, 200) || 20;
        params.push(limitVal);

        const sql = `
            SELECT
                p.id as product_id,
                p.name as product_name,
                COALESCE(SUM(si.quantity), 0)::numeric(12,3) as qty_sold,
                COALESCE(SUM(si.subtotal), 0)::numeric(12,2) as amount
            FROM sale_items si
            JOIN sales s ON s.id = si.sale_id
            JOIN products p ON p.id = si.product_id
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            GROUP BY p.id, p.name
            ORDER BY qty_sold DESC
            LIMIT $${params.length}
        `;

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getSalesByUser = async (req, res) => {
    try {
        const { from, to } = req.query;
        const params = [];
        const where = [];

        if (from) {
            params.push(from);
            where.push(`s.created_at >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            where.push(`s.created_at <= $${params.length}`);
        }

        const sql = `
            SELECT
                s.user_id,
                COALESCE(u.username, 'Sin usuario') as username,
                COUNT(*)::int as sales_count,
                COALESCE(SUM(s.total), 0)::numeric(12,2) as total_amount
            FROM sales s
            LEFT JOIN users u ON u.id = s.user_id
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            GROUP BY s.user_id, COALESCE(u.username, 'Sin usuario')
            ORDER BY total_amount DESC
        `;

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getInvoiceSummary = async (req, res) => {
    try {
        const { from, to } = req.query;
        const params = [];
        const where = [];

        if (from) {
            params.push(from);
            where.push(`s.created_at >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            where.push(`s.created_at <= $${params.length}`);
        }

        const sql = `
            SELECT
                CASE
                    WHEN i.id IS NULL THEN 'SIN_FACTURA'
                    WHEN i.status = 'APPROVED' THEN 'FACTURADA_APROBADA'
                    WHEN i.status = 'REJECTED' THEN 'FACTURADA_RECHAZADA'
                    WHEN i.status = 'ERROR' THEN 'FACTURADA_ERROR'
                    ELSE 'FACTURADA_PENDIENTE'
                END as invoice_group,
                COUNT(*)::int as sales_count,
                COALESCE(SUM(s.total), 0)::numeric(12,2) as total_amount
            FROM sales s
            LEFT JOIN invoices i ON i.sale_id = s.id
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            GROUP BY invoice_group
            ORDER BY total_amount DESC
        `;

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
