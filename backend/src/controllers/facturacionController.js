const db = require('../config/db');
const afipService = require('../services/afipService');
const { insertAuditLog } = require('../services/auditService');

/**
 * Facturar tickets uno por uno contra AFIP.
 * 
 * Cada ticket se convierte en:
 *   1. Un registro en la tabla `sales`
 *   2. Una llamada a AFIP (FECAESolicitar) via afipService
 *   3. Un registro en la tabla `invoices` con el CAE, vencimiento, etc.
 * 
 * Body esperado:
 * {
 *   tickets: [
 *     { id: 1, monto: 5000.00, tipo: 'Pollo', cliente: 'Consumidor Final' },
 *     ...
 *   ],
 *   cbteTipo: 6,       // opcional, default 6 (Factura B)
 *   docTipo: 99,        // opcional, default 99 (Consumidor Final)
 *   docNro: 0,          // opcional, default 0
 *   ptoVta: 1           // opcional, usa el del .env si no se envía
 * }
 */
const generarFactura = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { tickets, cbteTipo, docTipo, docNro, ptoVta } = req.body;

        if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de tickets con al menos un elemento' });
        }

        const tipoComprobante = cbteTipo || 6;   // Factura B por defecto
        const tipoDocumento = docTipo || 99;      // Consumidor Final
        const nroDocumento = docNro || 0;
        const puntoVenta = ptoVta || undefined;   // undefined → usa el del .env en afipService

        const resultados = [];

        // Procesamos cada ticket secuencialmente (AFIP requiere números correlativos)
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            const monto = parseFloat(ticket.monto);

            if (isNaN(monto) || monto <= 0) {
                resultados.push({
                    ticketId: ticket.id,
                    status: 'ERROR',
                    error: `Monto inválido: ${ticket.monto}`
                });
                continue;
            }

            try {
                await client.query('BEGIN');

                // 1. Crear registro de venta en la tabla sales
                const saleResult = await client.query(
                    `INSERT INTO sales (subtotal, discount_percent, discount, total, payment_method, client_name, user_id)
                     VALUES ($1, 0, 0, $2, $3, $4, $5) RETURNING id, created_at`,
                    [monto, monto, 'Efectivo', ticket.cliente || 'Consumidor Final', req.user ? req.user.id : null]
                );
                const saleId = saleResult.rows[0].id;
                const saleCreatedAt = saleResult.rows[0].created_at;

                // Audit log
                if (req.user) {
                    await insertAuditLog({
                        client,
                        userId: req.user.id,
                        action: 'CREATE_SALE_FACTURACION',
                        entityId: saleId,
                        details: { total: monto, tipo: ticket.tipo, cliente: ticket.cliente },
                    });
                }

                await client.query('COMMIT');

                // 2. Enviar a AFIP (fuera de la transacción para no bloquear si falla)
                const invoiceData = {
                    saleId,
                    total: monto,
                    cbteTipo: tipoComprobante,
                    docTipo: tipoDocumento,
                    docNro: nroDocumento,
                    ptoVta: puntoVenta
                };

                const afipResult = await afipService.emitInvoice(invoiceData);

                // 3. Resultado exitoso
                resultados.push({
                    ticketId: ticket.id,
                    saleId,
                    monto,
                    tipo: ticket.tipo,
                    cliente: ticket.cliente || 'Consumidor Final',
                    status: afipResult.status,
                    cae: afipResult.cae,
                    caeVencimiento: afipResult.cae_expiration,
                    cbteNro: afipResult.cbte_nro,
                    ptoVta: afipResult.pto_vta,
                    cbteTipo: afipResult.cbte_tipo,
                    fecha: saleCreatedAt
                });

            } catch (ticketError) {
                // Rollback si la transacción de venta falló
                try { await client.query('ROLLBACK'); } catch (_) { }

                console.error(`Error procesando ticket #${ticket.id}:`, ticketError.message);
                resultados.push({
                    ticketId: ticket.id,
                    monto,
                    status: 'ERROR',
                    error: ticketError.message
                });
            }
        }

        const aprobadas = resultados.filter(r => r.status === 'APPROVED').length;
        const errores = resultados.filter(r => r.status === 'ERROR').length;

        res.json({
            success: errores === 0,
            message: `Procesados: ${resultados.length} tickets. Aprobados: ${aprobadas}. Errores: ${errores}.`,
            facturas: resultados
        });

    } catch (error) {
        console.error('Error en facturación:', error);
        res.status(500).json({ error: 'Error al procesar la facturación: ' + error.message });
    } finally {
        client.release();
    }
};

/**
 * Obtener historial de facturas desde la base de datos.
 * JOIN con sales para traer datos completos.
 * 
 * Query params opcionales:
 *   - desde: fecha inicio (YYYY-MM-DD)
 *   - hasta: fecha fin (YYYY-MM-DD)
 *   - limit: cantidad máxima (default 100)
 */
const obtenerHistorial = async (req, res) => {
    try {
        const { desde, hasta, limit } = req.query;
        const maxResults = parseInt(limit) || 100;

        let query = `
            SELECT 
                i.id,
                i.sale_id,
                i.cae,
                i.cae_expiration,
                i.cbte_tipo,
                i.pto_vta,
                i.cbte_nro,
                i.doc_tipo,
                i.doc_nro,
                i.total,
                i.status,
                i.afip_error,
                i.created_at,
                s.client_name,
                s.payment_method,
                s.subtotal,
                s.discount,
                s.discount_percent
            FROM invoices i
            LEFT JOIN sales s ON i.sale_id = s.id
        `;

        const params = [];
        const conditions = [];

        if (desde) {
            params.push(desde);
            conditions.push(`i.created_at >= $${params.length}::date`);
        }
        if (hasta) {
            params.push(hasta);
            conditions.push(`i.created_at < ($${params.length}::date + interval '1 day')`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY i.created_at DESC';
        params.push(maxResults);
        query += ` LIMIT $${params.length}`;

        const result = await db.query(query, params);

        // Mapear campos para el frontend
        const facturas = result.rows.map(row => ({
            id: row.id,
            saleId: row.sale_id,
            cae: row.cae,
            caeVencimiento: row.cae_expiration,
            cbteTipo: row.cbte_tipo,
            ptoVta: row.pto_vta,
            cbteNro: row.cbte_nro,
            // Generar número de factura legible: PtoVta-CbteNro (ej: 0001-00000123)
            numeroFactura: row.pto_vta && row.cbte_nro
                ? `${String(row.pto_vta).padStart(4, '0')}-${String(row.cbte_nro).padStart(8, '0')}`
                : null,
            tipoComprobante: row.cbte_tipo === 1 ? 'Factura A'
                : row.cbte_tipo === 6 ? 'Factura B'
                    : row.cbte_tipo === 11 ? 'Factura C'
                        : `Tipo ${row.cbte_tipo}`,
            docTipo: row.doc_tipo,
            docNro: row.doc_nro,
            monto: parseFloat(row.total),
            status: row.status,
            afipError: row.afip_error,
            cliente: row.client_name || 'Consumidor Final',
            medioPago: row.payment_method,
            fecha: row.created_at
        }));

        res.json({
            success: true,
            facturas,
            total: facturas.length
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error al obtener el historial de facturas' });
    }
};

/**
 * Obtener una factura específica por ID (para reimprimir).
 */
const obtenerFactura = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT 
                i.*,
                s.client_name,
                s.payment_method,
                s.subtotal,
                s.discount,
                s.discount_percent
            FROM invoices i
            LEFT JOIN sales s ON i.sale_id = s.id
            WHERE i.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const row = result.rows[0];

        // Obtener items de la venta si existen
        let items = [];
        if (row.sale_id) {
            const itemsResult = await db.query(`
                SELECT si.*, p.name as product_name
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                WHERE si.sale_id = $1
            `, [row.sale_id]);
            items = itemsResult.rows;
        }

        res.json({
            success: true,
            factura: {
                id: row.id,
                saleId: row.sale_id,
                cae: row.cae,
                caeVencimiento: row.cae_expiration,
                cbteTipo: row.cbte_tipo,
                ptoVta: row.pto_vta,
                cbteNro: row.cbte_nro,
                numeroFactura: row.pto_vta && row.cbte_nro
                    ? `${String(row.pto_vta).padStart(4, '0')}-${String(row.cbte_nro).padStart(8, '0')}`
                    : null,
                tipoComprobante: row.cbte_tipo === 1 ? 'Factura A'
                    : row.cbte_tipo === 6 ? 'Factura B'
                        : row.cbte_tipo === 11 ? 'Factura C'
                            : `Tipo ${row.cbte_tipo}`,
                docTipo: row.doc_tipo,
                docNro: row.doc_nro,
                monto: parseFloat(row.total),
                status: row.status,
                afipError: row.afip_error,
                cliente: row.client_name || 'Consumidor Final',
                medioPago: row.payment_method,
                fecha: row.created_at,
                items
            }
        });

    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).json({ error: 'Error al obtener la factura' });
    }
};

module.exports = {
    generarFactura,
    obtenerHistorial,
    obtenerFactura
};
