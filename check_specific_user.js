const db = require('./db');

async function checkUser() {
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', ['thammarak']);
        if (users.length > 0) {
            console.log('User found:', users[0]);
        } else {
            console.log('User thammarak not found.');
        }

        const [allUsers] = await db.query('SELECT username, role FROM users');
        console.log('All users:', allUsers);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
