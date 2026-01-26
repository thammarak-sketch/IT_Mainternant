const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'prompt_db'
});

async function resetPassword() {
    try {
        const password = '1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user admin
        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE username = ?',
            [hashedPassword, 'admin']
        );

        if (result.affectedRows > 0) {
            console.log('Password for "admin" reset to "admin123" successfully.');
        } else {
            // Create user if not exists
            await pool.query(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                ['admin', hashedPassword]
            );
            console.log('User "admin" created with password "admin123".');
        }
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

resetPassword();
