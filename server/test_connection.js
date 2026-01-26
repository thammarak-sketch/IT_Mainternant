const mysql = require('mysql2/promise');

async function testConnection(host) {
    console.log(`Testing connection to ${host}...`);
    try {
        const connection = await mysql.createConnection({
            host: host,
            user: 'root',
            password: '',
            connectTimeout: 3000
        });
        console.log(`✅ Success connecting to ${host}`);
        await connection.end();
        return true;
    } catch (err) {
        console.log(`❌ Failed connecting to ${host}: ${err.message}`);
        return false;
    }
}

async function run() {
    await testConnection('127.0.0.1');
    await testConnection('localhost');
    process.exit(0);
}

run();
