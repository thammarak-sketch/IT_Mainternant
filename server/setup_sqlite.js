const db = require('./db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    try {
        console.log('Initializing ITAssist SQLite Database...');
        const dbPath = path.resolve(__dirname, 'prompt.db');

        // Optional: clear old DB if needed, but for now we'll just drop tables if they exist to ensure clean state for the new schema
        // Or we just let CREATE TABLE IF NOT EXISTS handle it, but since we are changing schema drastically, 
        // it might be cleaner to drop old tables if they are from the old project.
        // For safety, let's just create new tables. OLD tables will stay as garbage or we can drop them.
        // Let's drop old tables to be clean.
        await db.query('DROP TABLE IF EXISTS gallery_images');
        await db.query('DROP TABLE IF EXISTS prompts');
        await db.query('DROP TABLE IF EXISTS categories');
        // Keep users table but ensure it has what we need

        // Users Table (Admin/Staff)
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'staff', -- admin, staff
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Assets Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_code TEXT NOT NULL UNIQUE, -- e.g. IT-2024-001
                name TEXT NOT NULL,              -- e.g. MacBook Pro M1
                type TEXT NOT NULL,              -- Laptop, Monitor, Mouse, etc.
                brand TEXT,
                model TEXT,
                serial_number TEXT,
                purchase_date DATE,
                price DECIMAL(10, 2),
                status TEXT DEFAULT 'available', -- available, assigned, repair, retired, lost
                location TEXT,                   -- Office, Home, etc.
                image_path TEXT,
                notes TEXT,
                assigned_to TEXT,
                signature TEXT,
                email TEXT,
                is_pc INTEGER DEFAULT 0,
                is_mobile INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Ensure assigned_to and signature columns exist in assets (SQLite)
        try {
            await db.query(`ALTER TABLE assets ADD COLUMN assigned_to TEXT`);
            console.log("Added 'assigned_to' column to assets table.");
        } catch (err) {
            // SQLite throws error if column exists. Check message or just ignore.
            if (!err.message.includes('duplicate column')) console.log("Warning (assigned_to):", err.message);
        }

        try {
            await db.query(`ALTER TABLE assets ADD COLUMN signature TEXT`);
            console.log("Added 'signature' column to assets table.");
        } catch (err) {
            if (!err.message.includes('duplicate column')) console.log("Warning (signature):", err.message);
        }

        // Migration: Add spec, received_date, return_date
        try { await db.query(`ALTER TABLE assets ADD COLUMN spec TEXT`); console.log("Added 'spec' column."); } catch (err) { if (!err.message.includes('duplicate column')) console.log("Warning (spec):", err.message); }
        try { await db.query(`ALTER TABLE assets ADD COLUMN received_date DATE`); console.log("Added 'received_date' column."); } catch (err) { if (!err.message.includes('duplicate column')) console.log("Warning (received_date):", err.message); }
        try { await db.query(`ALTER TABLE assets ADD COLUMN return_date DATE`); console.log("Added 'return_date' column."); } catch (err) { if (!err.message.includes('duplicate column')) console.log("Warning (return_date):", err.message); }

        // New migrations for email and device types
        try { await db.query(`ALTER TABLE assets ADD COLUMN email TEXT`); console.log("Added 'email' column."); } catch (err) { if (!err.message.includes('duplicate column')) console.log("Warning (email):", err.message); }
        try { await db.query(`ALTER TABLE assets ADD COLUMN is_pc INTEGER DEFAULT 0`); console.log("Added 'is_pc' column."); } catch (err) { if (!err.message.includes('duplicate column')) console.log("Warning (is_pc):", err.message); }
        try { await db.query(`ALTER TABLE assets ADD COLUMN is_mobile INTEGER DEFAULT 0`); console.log("Added 'is_mobile' column."); } catch (err) { if (!err.message.includes('duplicate column')) console.log("Warning (is_mobile):", err.message); }

        // Assignments Table (History of who used what)
        await db.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                assigned_to TEXT NOT NULL,       -- Employee Name or ID
                assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                return_date DATETIME,
                notes TEXT,
                FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
            )
        `);

        // Maintenance/Repair Log
        await db.query('DROP TABLE IF EXISTS maintenance_logs');
        await db.query(`
            CREATE TABLE IF NOT EXISTS maintenance_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                description TEXT NOT NULL,
                cost DECIMAL(10, 2),
                reporter_name TEXT, -- Name of the person reporting
                contact_info TEXT,  -- Phone or Email
                department TEXT,    -- Department Dropdown
                log_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending', -- pending, completed
                FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
            )
        `);

        // Emails Table (Registration of emails used with devices)
        await db.query(`
            CREATE TABLE IF NOT EXISTS registration_emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                fullname TEXT,
                position TEXT,
                department TEXT,
                is_pc INTEGER DEFAULT 0,
                is_mobile INTEGER DEFAULT 0,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Tables created. Seeding data...');

        // Seed Admin
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', ['admin']);
        const password = '1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        if (users.length === 0) {
            await db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
            console.log(`User 'admin' created.`);
        } else {
            // Update to ensure schema match if needed, or just reset password
            await db.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
            console.log(`User 'admin' password reset.`);
        }

        // Seed Sample Assets
        const [assets] = await db.query('SELECT * FROM assets');
        if (assets.length === 0) {
            const sampleAssets = [
                {
                    asset_code: 'IT-2024-001',
                    name: 'Dell Latitude 7420',
                    type: 'Laptop',
                    brand: 'Dell',
                    model: 'Latitude 7420',
                    serial_number: 'DL123456',
                    purchase_date: '2024-01-15',
                    price: 45000,
                    status: 'available',
                    location: 'Stock Room'
                },
                {
                    asset_code: 'IT-2024-002',
                    name: 'MacBook Pro 14 M3',
                    type: 'Laptop',
                    brand: 'Apple',
                    model: 'MacBook Pro 14',
                    serial_number: 'C02XXXXX',
                    purchase_date: '2024-02-01',
                    price: 75000,
                    status: 'assigned',
                    location: 'User Desk'
                },
                {
                    asset_code: 'IT-MON-001',
                    name: 'Dell UltraSharp 27',
                    type: 'Monitor',
                    brand: 'Dell',
                    model: 'U2722DE',
                    serial_number: 'CN-0XXXX',
                    purchase_date: '2023-11-20',
                    price: 18000,
                    status: 'available',
                    location: 'Stock Room'
                }
            ];

            for (const asset of sampleAssets) {
                await db.query(`
                    INSERT INTO assets (asset_code, name, type, brand, model, serial_number, purchase_date, price, status, location)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [asset.asset_code, asset.name, asset.type, asset.brand, asset.model, asset.serial_number, asset.purchase_date, asset.price, asset.status, asset.location]);
            }
            console.log('Sample assets added.');
        }

        console.log('ITAssist Database Setup Complete! ✅');
        process.exit(0);

    } catch (err) {
        console.error('Setup Failed:', err);
        process.exit(1);
    }
}

setupDatabase();
