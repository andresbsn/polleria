const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { requireOpenCashSession } = require('../middleware/cashMiddleware');

router.get('/', protect, clientController.getClients);
router.post('/', protect, clientController.createClient);
router.get('/:id', protect, clientController.getClientById);
router.put('/:id', protect, isAdmin, clientController.updateClient);
router.post('/payment', protect, requireOpenCashSession, clientController.registerPayment);

module.exports = router;
