const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function migrate() {
    console.log("Starting Role/Audit Migration...");
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'migrate_roles_audit.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute SQL
        await client.query(sql);

        // Hash passwords for seed users if they aren't already
        // Admin
        const adminHash = await bcrypt.hash('admin123', 10);
        await client.query('UPDATE users SET password_hash = $1 WHERE username = $2', [adminHash, 'admin']);

        // Cajero
        const cajeroHash = await bcrypt.hash('cajero123', 10);
        // Ensure cajero exists first (the sql file insert might fail if conflict, but update always works)
        // Re-upsert cajero just to be sure
        await client.query(`
            INSERT INTO users (username, password_hash, role) 
            VALUES ('cajero', $1, 'user') 
            ON CONFLICT (username) 
            DO UPDATE SET password_hash = $1
        `, [cajeroHash]);

        await client.query('COMMIT');
        console.log("Migration successful! Users 'admin' and 'cajero' ready.");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", error.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
