const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log("Starting Clients & Account Migration...");
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'migrate_clients.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute SQL
        await client.query(sql);

        await client.query('COMMIT');
        console.log("Clients Migration successful!");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", error.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
