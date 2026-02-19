const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireOpenCashSession } = require('../middleware/cashMiddleware');

// Any logged in user can make a sale (Cashier/Admin)
router.post('/', verifyToken, requireOpenCashSession, salesController.createSale);
router.post('/retry-invoice', verifyToken, salesController.retryInvoice);
router.get('/', salesController.getSales);
router.get('/:id', salesController.getSaleById);

module.exports = router;
