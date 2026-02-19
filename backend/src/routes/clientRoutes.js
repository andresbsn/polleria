const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
const { requireOpenCashSession } = require('../middleware/cashMiddleware');

router.get('/', protect, clientController.getClients);
router.post('/', protect, clientController.createClient);
router.get('/:id', protect, clientController.getClientById);
router.post('/payment', protect, requireOpenCashSession, clientController.registerPayment);

module.exports = router;
