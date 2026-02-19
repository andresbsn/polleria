const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/sales-by-day', verifyToken, isAdmin, reportsController.getSalesSummaryByDay);
router.get('/sales-by-payment-method', verifyToken, isAdmin, reportsController.getSalesByPaymentMethod);
router.get('/top-products', verifyToken, isAdmin, reportsController.getTopProducts);
router.get('/sales-by-user', verifyToken, isAdmin, reportsController.getSalesByUser);
router.get('/invoice-summary', verifyToken, isAdmin, reportsController.getInvoiceSummary);

module.exports = router;
