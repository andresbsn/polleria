const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { requireOpenCashSession } = require('../middleware/cashMiddleware');

router.get('/', productController.getAllProducts);
// Only Admin can create/update products (which includes Stock updates)
router.post('/', verifyToken, isAdmin, requireOpenCashSession, productController.createProduct);
router.put('/:id', verifyToken, isAdmin, requireOpenCashSession, productController.updateProduct);

module.exports = router;
