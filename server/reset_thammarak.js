const db = require('./db');
const bcrypt = require('bcrypt');

async function resetUser() {
    try {
        const username = 'thammarak';
        const newPassword = '1234';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and role to admin
        await db.query(`
            UPDATE users 
            SET password = ?, role = 'admin' 
            WHERE username = ?
        `, [hashedPassword, username]);

        console.log(`Password for '${username}' has been reset to '${newPassword}' and role updated to 'admin'.`);

        // Verify
        const [user] = await db.query('SELECT username, role, password FROM users WHERE username = ?', [username]);
        console.log('Updated User Info:', user[0]);

        process.exit(0);
    } catch (err) {
        console.error('Failed to reset user:', err);
        process.exit(1);
    }
}

resetUser();
