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
        console.log('Initializing PostgreSQL Database on Render...');

        // Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'staff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Assignments Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
                assigned_to VARCHAR(255) NOT NULL,
                assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                return_date TIMESTAMP,
                notes TEXT
            )
        `);

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
