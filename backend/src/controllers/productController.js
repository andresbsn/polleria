const db = require('../config/db');
const { insertAuditLog } = require('../services/auditService');

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                p.*, 
                COALESCE(pc.name, p.category) AS category
            FROM products p
            LEFT JOIN product_categories pc ON pc.id = p.category_id
            ORDER BY p.id ASC
            `
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    const { name, price, category, category_id, stock, unit } = req.body;
    try {
        let catId = category_id !== undefined && category_id !== null && category_id !== '' ? parseInt(category_id, 10) : null;
        let catName = category !== undefined && category !== null ? String(category).trim() : '';

        if (catId && !Number.isNaN(catId)) {
            const catRes = await db.query('SELECT id, name FROM product_categories WHERE id = $1', [catId]);
            if (catRes.rows.length === 0) return res.status(400).json({ error: 'Categoría inválida' });
            catName = catRes.rows[0].name;
        } else {
            catId = null;
        }

        const result = await db.query(
            'INSERT INTO products (name, price, category, category_id, stock, unit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, price, catName || null, catId, stock || 0, unit || 'UNIT']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update product
// Update product
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, category, category_id, stock, is_active, unit } = req.body;
    try {
        // Get old values for details
        const oldRes = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        const oldData = oldRes.rows[0];

        if (!oldData) return res.status(404).json({ error: 'Product not found' });

        const nextUnit = unit !== undefined && unit !== null && unit !== '' ? unit : oldData.unit;

        let catId = category_id !== undefined && category_id !== null && category_id !== '' ? parseInt(category_id, 10) : oldData.category_id;
        let catName = category !== undefined && category !== null ? String(category).trim() : oldData.category;

        if (catId && !Number.isNaN(catId)) {
            const catRes = await db.query('SELECT id, name FROM product_categories WHERE id = $1', [catId]);
            if (catRes.rows.length === 0) return res.status(400).json({ error: 'Categoría inválida' });
            catName = catRes.rows[0].name;
        } else {
            catId = null;
        }

        const result = await db.query(
            'UPDATE products SET name = $1, price = $2, category = $3, category_id = $4, stock = $5, is_active = $6, unit = $7 WHERE id = $8 RETURNING *',
            [name, price, catName || null, catId, stock, is_active, nextUnit, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

        const newData = result.rows[0];

        // Audit if user exists (admin usually)
        if (req.user) {
            await insertAuditLog({
                userId: req.user.id,
                action: 'UPDATE_PRODUCT',
                entityId: id,
                details: { old: oldData, new: newData },
            });

            if (oldData && newData) {
                const oldPrice = oldData.price !== null && oldData.price !== undefined ? parseFloat(oldData.price) : null;
                const newPrice = newData.price !== null && newData.price !== undefined ? parseFloat(newData.price) : null;
                if (oldPrice !== null && newPrice !== null && oldPrice !== newPrice) {
                    await insertAuditLog({
                        userId: req.user.id,
                        action: 'PRICE_CHANGE',
                        entityId: id,
                        details: { field: 'price', old: oldPrice, new: newPrice },
                    });
                }

                const oldStock = oldData.stock !== null && oldData.stock !== undefined ? parseFloat(oldData.stock) : null;
                const newStock = newData.stock !== null && newData.stock !== undefined ? parseFloat(newData.stock) : null;
                if (oldStock !== null && newStock !== null && oldStock !== newStock) {
                    const delta = newStock - oldStock;
                    await insertAuditLog({
                        userId: req.user.id,
                        action: delta > 0 ? 'STOCK_IN' : 'STOCK_ADJUST',
                        entityId: id,
                        details: { field: 'stock', old: oldStock, new: newStock, delta },
                    });
                }

                if (oldData.unit !== newData.unit) {
                    await insertAuditLog({
                        userId: req.user.id,
                        action: 'UNIT_CHANGE',
                        entityId: id,
                        details: { field: 'unit', old: oldData.unit, new: newData.unit },
                    });
                }
            }
        }

        res.json(newData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
