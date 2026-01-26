const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function run() {
    console.log('Attempting connection to 127.0.0.1...');
    const pool = mysql.createPool({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'prompt_db',
        connectTimeout: 5000
    });

    try {
        const [rows] = await pool.query('SELECT 1 as val');
        console.log('Connection successful!', rows);

        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(' resetting password to "admin"...');

        const [res] = await pool.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
        console.log('Update result:', res);

        const [users] = await pool.query('SELECT username, password FROM users WHERE username="admin"');
        console.log('Current Admin User:', users[0]);
        console.log('Password reset complete. Exiting.');
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
}

run();
