const db = require('./db');

async function migrate() {
    try {
        console.log('Running migration: Create registration_emails table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS registration_emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                is_pc INTEGER DEFAULT 0,
                is_mobile INTEGER DEFAULT 0,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Migration successful! ✅');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
