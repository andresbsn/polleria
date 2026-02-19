const { Pool } = require('pg');

const credentialsToTry = [
    { user: 'postgres', password: 'password', db: 'postgres' },
    { user: 'postgres', password: 'password', db: 'polleria_pos' },
    { user: 'admin', password: 'password', db: 'polleria_pos' },
    { user: 'postgres', password: 'postgres', db: 'postgres' },
    { user: 'postgres', password: 'admin', db: 'postgres' },
    { user: 'admin', password: 'admin', db: 'polleria_pos' },
    { user: 'postgres', password: '', db: 'postgres' },
];

async function testConnection() {
    console.log("Brute-force testing connections...");

    for (const cred of credentialsToTry) {
        console.log(`Trying User: ${cred.user}, Pass: '${cred.password}', DB: ${cred.db}...`);
        const pool = new Pool({
            user: cred.user,
            host: 'localhost',
            database: cred.db,
            password: cred.password,
            port: 5432,
        });

        try {
            const res = await pool.query('SELECT NOW()');
            console.log(`>>> SUCCESS! Valid credentials found: User=${cred.user}, Pass='${cred.password}', DB=${cred.db}`);
            await pool.end();
            return; // Exit on first success
        } catch (err) {
            // console.log(`   Failed: ${err.message}`);
            // silence detailed logging to keep output clean, just try next
        } finally {
            // ensure pool is closed if not ended
            try { await pool.end(); } catch (e) { }
        }
    }
    console.log("All attempts failed.");
}

testConnection();
