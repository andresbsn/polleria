const express = require('express');
const router = express.Router();
const { generarFactura, obtenerHistorial } = require('../controllers/facturacionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generar', protect, generarFactura);
router.get('/historial', protect, obtenerHistorial);

module.exports = router;
