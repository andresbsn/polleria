const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

router.get('/users', verifyToken, isSuperAdmin, adminUserController.listUsers);
router.post('/users', verifyToken, isSuperAdmin, adminUserController.createUser);

module.exports = router;
