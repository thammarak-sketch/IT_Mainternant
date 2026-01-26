
const axios = require('axios');
const db = require('./server/db');

async function testForm() {
    try {
        console.log("Testing External Repair with Cost...");
        // Need an asset ID first. Let's get one.
        const [assets] = await db.query("SELECT id FROM assets LIMIT 1");
        if (assets.length === 0) {
            console.log("No assets to test with.");
            return;
        }
        const assetId = assets[0].id;

        const res1 = await axios.post('http://localhost:3000/api/maintenance', {
            asset_id: assetId,
            service_type: 'repair',
            repair_method: 'external',
            cost: 500,
            description: 'Test External Repair',
            reporter_name: 'Tester',
            department: 'IT'
        });
        console.log('Result 1 ID:', res1.data.id);

        console.log("Testing Internal Repair without Cost...");
        const res2 = await axios.post('http://localhost:3000/api/maintenance', {
            asset_id: assetId,
            service_type: 'repair',
            repair_method: 'internal',
            cost: '',
            description: 'Test Internal Repair',
            reporter_name: 'Tester',
            department: 'IT'
        });
        console.log('Result 2 ID:', res2.data.id);

        // Check DB
        const [rows] = await db.query(`SELECT id, repair_method, cost, description FROM maintenance_logs WHERE id IN (?, ?)`, [res1.data.id, res2.data.id]);
        console.log('DB Rows:', rows);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    } finally {
        process.exit(0);
    }
}

testForm();
