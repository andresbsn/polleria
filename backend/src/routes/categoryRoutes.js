const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, categoryController.getCategories);
router.post('/', verifyToken, isSuperAdmin, categoryController.createCategory);
router.put('/:id', verifyToken, isSuperAdmin, categoryController.setCategoryActive);

module.exports = router;
