const db = require('../config/db');

exports.getCategories = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, is_active, created_at FROM product_categories ORDER BY name ASC'
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'Nombre requerido' });
        }

        const normalized = String(name).trim();

        const result = await db.query(
            'INSERT INTO product_categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET is_active = TRUE RETURNING id, name, is_active, created_at',
            [normalized]
        );

        res.status(201).json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.setCategoryActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const next = is_active === false ? false : true;

        const result = await db.query(
            'UPDATE product_categories SET is_active = $1 WHERE id = $2 RETURNING id, name, is_active, created_at',
            [next, parseInt(id, 10)]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });

        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
