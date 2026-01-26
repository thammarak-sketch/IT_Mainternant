const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Enable multiple statements for schema creation
};

async function setupDatabase() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Creating Database if not exists...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS prompt_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE prompt_db`);

        console.log('Creating Tables...');

        // Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Categories Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Prompts Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS prompts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category_id INT,
                cover_image VARCHAR(500),
                url VARCHAR(500),
                views INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        `);

        // Gallery Images Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS gallery_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                prompt_id INT NOT NULL,
                image_path VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
            )
        `);

        console.log('Seeding Default Data...');

        // Seed Admin
        const password = '1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin exists
        const [users] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
        if (users.length === 0) {
            await connection.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
            console.log(`User 'admin' created with password '${password}'`);
        } else {
            await connection.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
            console.log(`User 'admin' password reset to '${password}'`);
        }

        // Seed Categories if empty
        const [cats] = await connection.query('SELECT * FROM categories');
        if (cats.length === 0) {
            await connection.query(`
                INSERT INTO categories (name) VALUES 
                ('General'), ('Copywriting'), ('Coding'), ('Art & Design'), ('Marketing')
            `);
            console.log('Default categories added.');
        }

        console.log('Database Setup Complete! ✅');
        process.exit(0);

    } catch (err) {
        console.error('Setup Failed:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();
