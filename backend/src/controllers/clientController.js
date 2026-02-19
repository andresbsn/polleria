const db = require('../config/db');

// List Clients
exports.getClients = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clients ORDER BY name ASC');
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Create Client
exports.createClient = async (req, res) => {
    const { name, tax_id, tax_type, address, phone, email } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO clients (name, tax_id, tax_type, address, phone, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, tax_id, tax_type, address, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Get Client Details
exports.getClientById = async (req, res) => {
    const { id } = req.params;
    try {
        const clientRes = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
        if (clientRes.rows.length === 0) return res.status(404).json({ error: 'Client not found' });

        // Get recent movements
        const movementsRes = await db.query(
            'SELECT * FROM client_movements WHERE client_id = $1 ORDER BY created_at DESC LIMIT 50',
            [id]
        );

        res.json({
            ...clientRes.rows[0],
            movements: movementsRes.rows
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Register Payment
exports.registerPayment = async (req, res) => {
    const { client_id, amount, payment_method, notes } = req.body;
    const client = await db.pool.connect();

    try {
        const cashSessionId = req.cashSession ? req.cashSession.id : null;
        await client.query('BEGIN');

        // 1. Get current balance
        const clientRes = await client.query('SELECT current_account_balance FROM clients WHERE id = $1', [client_id]);
        if (clientRes.rows.length === 0) throw new Error('Client not found');

        const currentBalance = parseFloat(clientRes.rows[0].current_account_balance);
        const newBalance = currentBalance - parseFloat(amount); // Payment reduces debt

        // 2. Update Client Balance
        await client.query('UPDATE clients SET current_account_balance = $1 WHERE id = $2', [newBalance, client_id]);

        // 3. Create Movement Entry
        await client.query(
            `INSERT INTO client_movements (client_id, type, amount, balance_after, description, user_id) 
             VALUES ($1, 'PAYMENT', $2, $3, $4, $5)`,
            [client_id, -amount, newBalance, `Pago: ${payment_method}. ${notes || ''}`, req.user ? req.user.id : null]
        );

        // 4. Create Payment Record
        await client.query(
            `INSERT INTO client_payments (client_id, amount, payment_method, notes, user_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [client_id, amount, payment_method, notes, req.user ? req.user.id : null]
        );

        // Cash movement (Ingreso) for payment
        if (cashSessionId && req.user) {
            const nAmount = parseFloat(amount);
            await client.query(
                `INSERT INTO cash_movements (session_id, user_id, type, amount, description, reference_table, reference_id)
                 VALUES ($1, $2, 'PAYMENT', $3, $4, 'client_payments', NULL)`,
                [cashSessionId, req.user.id, nAmount, `Cobro Cta. Cte. Cliente #${client_id} (${payment_method})`]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Payment registered', new_balance: newBalance });

    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
};
