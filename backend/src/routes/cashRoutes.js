const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/current', verifyToken, cashController.getCurrentSession);
router.post('/open', verifyToken, cashController.openSession);
router.post('/close', verifyToken, cashController.closeSession);
router.get('/movements', verifyToken, cashController.getMovements);

module.exports = router;
