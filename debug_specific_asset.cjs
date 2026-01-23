const db = require('./server/db');

async function checkAsset() {
    try {
        const code = 'NEW-1768985681069';
        console.log(`Checking asset ${code}...`);
        const [rows] = await db.query('SELECT id, asset_code, name, typeof(id) as type_id FROM assets WHERE asset_code = ?', [code]);
        console.log(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAsset();
