const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, isSuperAdmin, auditController.getAuditLogs);

module.exports = router;
