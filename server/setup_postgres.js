const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not set. Cannot run PostgreSQL setup.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Render
});

async function setupDatabase() {
    try {
        console.log('Initializing PostgreSQL Database (v2 - Migration Fix)...');

        // Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                fullname VARCHAR(255),
                role VARCHAR(50) DEFAULT 'staff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Ensure fullname column exists (for existing tables)
        // Some older Postgres versions don't support ADD COLUMN IF NOT EXISTS
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN fullname VARCHAR(255)`);
            console.log("Added 'fullname' column to users table.");
        } catch (err) {
            if (err.code === '42701') { // duplicate_column error code in Postgres
                console.log("'fullname' column already exists so skipping.");
            } else {
                console.log("Warning: Could not alter users table:", err.message);
            }
        }

        // Assets Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assets (
                id SERIAL PRIMARY KEY,
                asset_code VARCHAR(100) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                brand VARCHAR(100),
                model VARCHAR(100),
                serial_number VARCHAR(100),
                purchase_date DATE,
                price DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'available',
                location VARCHAR(255),
                image_path VARCHAR(500),
                notes TEXT,
                assigned_to VARCHAR(255),
                signature TEXT,
                email VARCHAR(255),
                is_pc INTEGER DEFAULT 0,
                is_mobile INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Ensure assigned_to and signature columns exist in assets
        try {
            await pool.query(`ALTER TABLE assets ADD COLUMN assigned_to VARCHAR(255)`);
            console.log("Added 'assigned_to' column to assets table.");
        } catch (err) {
            if (err.code !== '42701') console.log("Warning: Could not add assigned_to:", err.message);
        }

        try {
            await pool.query(`ALTER TABLE assets ADD COLUMN signature TEXT`);
            console.log("Added 'signature' column to assets table.");
        } catch (err) {
            if (err.code !== '42701') console.log("Warning: Could not add signature:", err.message);
        }

        // Migration: Add spec, received_date, return_date
        try { await pool.query(`ALTER TABLE assets ADD COLUMN spec TEXT`); console.log("Added 'spec' column."); } catch (err) { if (err.code !== '42701') console.log("Warning (spec):", err.message); }
        try { await pool.query(`ALTER TABLE assets ADD COLUMN received_date DATE`); console.log("Added 'received_date' column."); } catch (err) { if (err.code !== '42701') console.log("Warning (received_date):", err.message); }
        try { await pool.query(`ALTER TABLE assets ADD COLUMN return_date DATE`); console.log("Added 'return_date' column."); } catch (err) { if (err.code !== '42701') console.log("Warning (return_date):", err.message); }

        // New migrations for email and device types
        try { await pool.query(`ALTER TABLE assets ADD COLUMN email VARCHAR(255)`); console.log("Added 'email' column."); } catch (err) { if (err.code !== '42701') console.log("Warning (email):", err.message); }
        try { await pool.query(`ALTER TABLE assets ADD COLUMN is_pc INTEGER DEFAULT 0`); console.log("Added 'is_pc' column."); } catch (err) { if (err.code !== '42701') console.log("Warning (is_pc):", err.message); }
        try { await pool.query(`ALTER TABLE assets ADD COLUMN is_mobile INTEGER DEFAULT 0`); console.log("Added 'is_mobile' column."); } catch (err) { if (err.code !== '42701') console.log("Warning (is_mobile):", err.message); }

        // Assignments Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
                assigned_to VARCHAR(255) NOT NULL,
                assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                return_date TIMESTAMP,
                notes TEXT,
                signature TEXT -- New column for signature
            )
        `);

        // Migration: Ensure signature column exists for assignments
        try {
            await pool.query(`ALTER TABLE assignments ADD COLUMN signature TEXT`);
            console.log("Added 'signature' column to assignments table.");
        } catch (err) {
            if (err.code === '42701') {
                console.log("'signature' column already exists in assignments.");
            } else {
                console.log("Warning: Could not alter assignments table:", err.message);
            }
        }

        // Maintenance Logs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS maintenance_logs (
                id SERIAL PRIMARY KEY,
                asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                cost DECIMAL(10, 2),
                reporter_name VARCHAR(255),
                contact_info VARCHAR(255),
                department VARCHAR(100),
                log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'pending',
                technician_name VARCHAR(255),
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                signature TEXT,
                repair_method VARCHAR(50),
                signer_name VARCHAR(255),
                service_type VARCHAR(50) DEFAULT 'repair',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Emails Table (Registration of emails used with devices)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS registration_emails (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                fullname VARCHAR(255),
                position VARCHAR(100),
                department VARCHAR(100),
                is_pc INTEGER DEFAULT 0,
                is_mobile INTEGER DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Tables created successfully.');

        // Seed Admin
        const { rows: users } = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        const password = '1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        if (users.length === 0) {
            await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', ['admin', hashedPassword, 'admin']);
            console.log(`User 'admin' created.`);
        } else {
            // Optional: reset password on deploy if needed, or leave it
            // await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, 'admin']);
            // console.log(`User 'admin' password reset.`);
        }

        console.log('PostgreSQL Database Setup Complete! ✅');
        process.exit(0);

    } catch (err) {
        console.error('Setup Failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupDatabase();
