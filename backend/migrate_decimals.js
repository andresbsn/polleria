const db = require('./src/config/db');

async function migrate() {
    console.log("Starting migration to DECIMAL for quantities...");

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Change sale_items.quantity to DECIMAL
        console.log("Altering sale_items.quantity...");
        await client.query(`ALTER TABLE sale_items ALTER COLUMN quantity TYPE DECIMAL(10, 3);`);

        // 2. Change products.stock to DECIMAL
        console.log("Altering products.stock...");
        await client.query(`ALTER TABLE products ALTER COLUMN stock TYPE DECIMAL(10, 3);`);

        await client.query('COMMIT');
        console.log("Migration successful!");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", error.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
