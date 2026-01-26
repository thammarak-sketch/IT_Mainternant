const axios = require('axios');
const db = require('./server/db');

async function testAssetFetch() {
    try {
        console.log("Fetching NEW- assets...");
        const [assets] = await db.query("SELECT id, asset_code FROM assets WHERE asset_code LIKE 'NEW-%' LIMIT 1");

        if (assets.length === 0) {
            console.log("No NEW- assets found in DB.");
            return;
        }

        const assetId = assets[0].id; // Keep as is (integer)
        const assetCode = assets[0].asset_code;
        console.log(`Found asset ID: ${assetId} (Type: ${typeof assetId}), Code: ${assetCode}`);

        // 3. Test via axios
        const url = `http://localhost:3000/api/assets/${assetId}`;
        console.log(`Testing API GET ${url}...`);
        const response = await axios.get(url);
        console.log('API Response Status:', response.status);
        console.log('API Response Data ID:', response.data.id);

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('API Error Response:', error.response.status, error.response.data);
        }
    }
}

testAssetFetch();
