const db = require('../config/db');
const afipService = require('../services/afipService'); // We will create this next
const { insertAuditLog } = require('../services/auditService');

// Init Sale (Internal Ticket)
exports.createSale = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { items, payment_method, client_name, should_invoice, client_doc_nro, client_doc_tipo, client_id, pto_vta, discount_percent } = req.body;

        const cashSessionId = req.cashSession ? req.cashSession.id : null;

        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const discountPct = discount_percent !== undefined && discount_percent !== null && discount_percent !== ''
            ? parseFloat(discount_percent)
            : 0;

        if (Number.isNaN(discountPct) || discountPct < 0 || discountPct > 100) {
            throw new Error('Porcentaje de descuento inválido');
        }

        const discount = (subtotal * discountPct) / 100;
        const total = subtotal - discount;

        await client.query('BEGIN');

        // 0. Update Client Balance if Cuenta Corriente
        if (payment_method === 'Cuenta Corriente') {
            if (!client_id) {
                throw new Error("Debe seleccionar un cliente para Cuenta Corriente");
            }

            // Update Balance
            const clientUpdate = await client.query(
                'UPDATE clients SET current_account_balance = current_account_balance + $1 WHERE id = $2 RETURNING current_account_balance',
                [total, client_id]
            );

            if (clientUpdate.rows.length === 0) throw new Error("Cliente no encontrado");

            // We log the movement AFTER generating the sale ID? No, we need sale ID for reference. 
            // So we insert sale first, then movement.
        }

        // 1. Create Sale Header
        const saleResult = await client.query(
            'INSERT INTO sales (subtotal, discount_percent, discount, total, payment_method, client_name, user_id, client_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [subtotal, discountPct, discount, total, payment_method, client_name || 'Consumidor Final', req.user ? req.user.id : null, client_id]
        );
        const saleId = saleResult.rows[0].id;

        // Cash movement for sale (only for immediate payment methods)
        if (cashSessionId && req.user && payment_method !== 'Cuenta Corriente') {
            await client.query(
                `INSERT INTO cash_movements (session_id, user_id, type, amount, description, reference_table, reference_id)
                 VALUES ($1, $2, 'SALE', $3, $4, 'sales', $5)`,
                [cashSessionId, req.user.id, total, `Venta #${saleId} (${payment_method})`, saleId]
            );

            await client.query(
                `UPDATE cash_sessions
                 SET total_sales = total_sales + $1
                 WHERE id = $2`,
                [total, cashSessionId]
            );
        }

        if (req.user) {
            await insertAuditLog({
                client,
                userId: req.user.id,
                action: 'CREATE_SALE',
                entityId: saleId,
                details: { subtotal, discount_percent: discountPct, discount, total, payment_method, client_id: client_id || null },
            });
        }

        // 1.5. Log Movement if Cuenta Corriente (now we have saleId)
        if (payment_method === 'Cuenta Corriente') {
            const clientRes = await client.query('SELECT current_account_balance FROM clients WHERE id = $1', [client_id]);
            const currentBalance = parseFloat(clientRes.rows[0].current_account_balance);

            await client.query(
                `INSERT INTO client_movements (client_id, type, amount, balance_after, description, reference_id, user_id)
                 VALUES ($1, 'SALE', $2, $3, $4, $5, $6)`,
                [client_id, total, currentBalance, 'Compra #' + saleId, saleId, req.user ? req.user.id : null]
            );
        }

        // 2. Create Items
        for (const item of items) {
            await client.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [saleId, item.product_id, item.quantity, item.price, item.price * item.quantity]
            );

            const productRes = await client.query(
                'SELECT id, stock FROM products WHERE id = $1 FOR UPDATE',
                [item.product_id]
            );
            if (productRes.rows.length === 0) {
                throw new Error(`Producto no encontrado (id=${item.product_id})`);
            }

            const oldStock = productRes.rows[0].stock !== null && productRes.rows[0].stock !== undefined
                ? parseFloat(productRes.rows[0].stock)
                : 0;
            const qty = parseFloat(item.quantity);
            const newStock = oldStock - qty;
            if (newStock < 0) {
                throw new Error(`Stock insuficiente para producto id=${item.product_id}. Stock=${oldStock}, requerido=${qty}`);
            }

            const updatedRes = await client.query(
                'UPDATE products SET stock = $1 WHERE id = $2 RETURNING stock',
                [newStock, item.product_id]
            );

            if (req.user) {
                await insertAuditLog({
                    client,
                    userId: req.user.id,
                    action: 'STOCK_OUT_SALE',
                    entityId: item.product_id,
                    details: {
                        sale_id: saleId,
                        quantity: qty,
                        old_stock: oldStock,
                        new_stock: updatedRes.rows[0] ? updatedRes.rows[0].stock : newStock,
                    },
                });
            }
        }

        await client.query('COMMIT');

        let invoiceResult = null;
        if (should_invoice) {
            // Prepare invoice data object
            const invoiceData = {
                saleId,
                total,
                cbteTipo: 6, // Factura B default
                docTipo: client_doc_tipo || 99, // 99 Consumidor Final
                docNro: client_doc_nro || 0,
                ptoVta: pto_vta
            };

            // If client has CUIT, assume Factura A (cbte_tipo 1) check logic needed here
            // usually 80 = CUIT. If CUIT is present, might be A or B depending on receptor.
            // For simplicity: If docTipo is 80, we might try Factura A, but for now defaulting B unless logic changes.
            if (client_doc_tipo == 80) {
                invoiceData.cbteTipo = 1; // Factura A
            }

            // We call the service to Emit. 
            // Note: In a real high-throughput POS, this might be a queue job.
            // Here we do it inline for immediate feedback, but handle timeouts carefully.
            try {
                invoiceResult = await afipService.emitInvoice(invoiceData);
            } catch (afipErr) {
                console.error("AFIP Error", afipErr);
                invoiceResult = { status: 'ERROR', error: afipErr.message };
            }
        }

        res.status(201).json({
            sale_id: saleId,
            sale: {
                id: saleId,
                items: items,
                subtotal: subtotal,
                discount_percent: discountPct,
                discount: discount,
                total: total,
                payment_method: payment_method,
                client_name: client_name,
                created_at: new Date()
            },
            message: 'Sale created',
            invoice: invoiceResult
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// Retry Invoice (Idempotency)
exports.retryInvoice = async (req, res) => {
    const { saleId } = req.body;
    try {
        // 1. Get Sale
        const saleRes = await db.query('SELECT * FROM sales WHERE id = $1', [saleId]);
        if (saleRes.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
        const sale = saleRes.rows[0];

        // 2. Check if Invoice exists and is Approved
        const invRes = await db.query('SELECT * FROM invoices WHERE sale_id = $1 AND status = $2', [saleId, 'APPROVED']);
        if (invRes.rows.length > 0) {
            return res.json({ message: 'Invoice already exists', invoice: invRes.rows[0] });
        }

        // 3. Prepare Data
        // Defaulting to B/Consumidor Final for retry unless more data provided
        const invoiceData = {
            saleId: sale.id,
            total: sale.total,
            cbteTipo: 6, // Hardcoded B for simplicity in this snippet
            docTipo: 99,
            docNro: 0
        };

        const result = await afipService.emitInvoice(invoiceData);
        res.json(result);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getSales = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT s.*, i.cae, i.status as invoice_status, i.cbte_nro, i.afip_error 
            FROM sales s 
            LEFT JOIN invoices i ON s.id = i.sale_id 
            ORDER BY s.id DESC 
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getSaleById = async (req, res) => {
    const { id } = req.params;
    try {
        const saleRes = await db.query(`
            SELECT s.*, i.cae, i.status as invoice_status, i.cbte_nro, i.pto_vta, i.cbte_tipo, i.cae_expiration
            FROM sales s 
            LEFT JOIN invoices i ON s.id = i.sale_id 
            WHERE s.id = $1
        `, [id]);

        if (saleRes.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });

        const itemsRes = await db.query(`
            SELECT si.*, p.name as product_name
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = $1
        `, [id]);

        const sale = saleRes.rows[0];
        sale.items = itemsRes.rows;

        res.json(sale);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
