const axios = require('axios');

async function testAssetGen() {
    try {
        console.log("Creating first asset...");
        const res1 = await axios.post('http://localhost:3000/api/maintenance', {
            service_type: 'new_setup',
            new_employee_name: 'Test Emp 1',
            asset_type: 'Laptop',
            department: 'IT',
            description: 'Test setup 1'
        });
        console.log('Result 1:', res1.data);

        // We can't easily see the code from the response directly as it returns the maintenance log ID.
        // But we can check the DB or just trust the logic if no error.
        // Let's query the DB to be sure.
        const db = require('./server/db');
        const [rows] = await db.query('SELECT asset_code FROM assets ORDER BY id DESC LIMIT 2');
        console.log('Latest Assets:', rows);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    } finally {
        process.exit(0);
    }
}

testAssetGen();
