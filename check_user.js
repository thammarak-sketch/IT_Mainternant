const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'prompt_db'
});

async function checkUser() {
    try {
        console.log('Connecting to database...');
        const [users] = await pool.query('SELECT id, username, password FROM users');
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`User: ${u.username}, Password Hash: ${u.password.substring(0, 20)}...`);
        });
        process.exit();
    } catch (err) {
        console.error('Error connecting or querying:', err);
        process.exit(1);
    }
}

checkUser();
