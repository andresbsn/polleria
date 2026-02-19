const db = require('../config/db');

const insertAuditLog = async ({
    client,
    userId,
    action,
    entityId,
    details,
}) => {
    const executor = client || db;
    await executor.query(
        'INSERT INTO audit_logs (user_id, action, entity_id, details) VALUES ($1, $2, $3, $4)',
        [userId || null, action, entityId || null, details ? JSON.stringify(details) : null]
    );
};

module.exports = {
    insertAuditLog,
};
