const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('Starting Product Units Migration...');
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const sqlPath = path.join(__dirname, 'migrate_product_units.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);

        await client.query('COMMIT');
        console.log('Product Units Migration successful!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
