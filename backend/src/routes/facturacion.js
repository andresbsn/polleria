const express = require('express');
const router = express.Router();
const { generarFactura, obtenerHistorial, obtenerFactura } = require('../controllers/facturacionController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/facturacion/generar - Facturar tickets uno por uno contra AFIP
router.post('/generar', protect, generarFactura);

// GET /api/facturacion/historial - Obtener historial de facturas (con filtros opcionales: ?desde=&hasta=&limit=)
router.get('/historial', protect, obtenerHistorial);

// GET /api/facturacion/:id - Obtener una factura específica para reimprimir
router.get('/:id', protect, obtenerFactura);

module.exports = router;
