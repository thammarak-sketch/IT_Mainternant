const db = require('./db');

/**
 * Robust migration system that runs on startup.
 * It ensures tables exist and then attempts to add any missing columns.
 */
async function runMigrations() {
    try {
        const isPostgres = !!process.env.DATABASE_URL;
        console.log(`Checking database and running auto-migrations (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);

        const idType = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

        // 1. Ensure required tables exist (Basic version)
        const tableQueries = [
            `CREATE TABLE IF NOT EXISTS users (id ${idType}, username TEXT UNIQUE, password TEXT)`,
            `CREATE TABLE IF NOT EXISTS assets (id ${idType}, asset_code TEXT UNIQUE, name TEXT, type TEXT)`,
            `CREATE TABLE IF NOT EXISTS registration_emails (id ${idType}, email TEXT UNIQUE)`,
            `CREATE TABLE IF NOT EXISTS maintenance_logs (id ${idType}, asset_id INTEGER, description TEXT)`
        ];

        for (const sql of tableQueries) {
            try { await db.query(sql); } catch (e) { /* Ignore */ }
        }

        // 2. List of columns to ensure exist across various tables
        const migrations = [
            // Users
            ['users', 'fullname', 'TEXT'],
            ['users', 'role', 'TEXT DEFAULT \'staff\''],
            // Assets
            ['assets', 'assigned_to', 'TEXT'],
            ['assets', 'signature', 'TEXT'],
            ['assets', 'spec', 'TEXT'],
            ['assets', 'received_date', 'DATE'],
            ['assets', 'return_date', 'DATE'],
            ['assets', 'email', 'TEXT'],
            ['assets', 'is_pc', 'INTEGER DEFAULT 0'],
            ['assets', 'is_mobile', 'INTEGER DEFAULT 0'],
            ['assets', 'software', 'TEXT'],
            // Registration Emails
            ['registration_emails', 'fullname', 'TEXT'],
            ['registration_emails', 'position', 'TEXT'],
            ['registration_emails', 'department', 'TEXT'],
            ['registration_emails', 'is_pc', 'INTEGER DEFAULT 0'],
            ['registration_emails', 'is_mobile', 'INTEGER DEFAULT 0'],
            ['registration_emails', 'notes', 'TEXT'],
            // Maintenance Logs
            ['maintenance_logs', 'technician_name', 'TEXT'],
            ['maintenance_logs', 'started_at', 'TIMESTAMP'],
            ['maintenance_logs', 'completed_at', 'TIMESTAMP'],
            ['maintenance_logs', 'signature', 'TEXT'],
            ['maintenance_logs', 'repair_method', 'TEXT'],
            ['maintenance_logs', 'signer_name', 'TEXT'],
            ['maintenance_logs', 'service_type', 'TEXT DEFAULT \'repair\'']
        ];

        for (const [table, col, type] of migrations) {
            try {
                // Attempt to add column. Postgres and SQLite will throw error if exists.
                await db.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
                console.log(`Column ${col} added to ${table} successfully. ✅`);
            } catch (err) {
                const msg = err.message.toLowerCase();
                // 42701 is Postgres "duplicate column", message check for SQLite
                if (err.code === '42701' || msg.includes('duplicate column') || msg.includes('already exists')) {
                    // All good, column already there.
                } else {
                    console.log(`Migration note (${table}.${col}): ${err.message}`);
                }
            }
        }

        console.log('Database auto-migration check completed. ✅');
    } catch (err) {
        console.error('Critical failure in auto-migration system:', err);
    }
}

module.exports = runMigrations;
