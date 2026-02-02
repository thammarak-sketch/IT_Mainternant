const db = require('./server/db');

async function checkAssetImages() {
    try {
        const [rows] = await db.query('SELECT id, asset_code, name, image_path FROM assets ORDER BY id DESC LIMIT 5');
        console.log('Last 5 Assets:');
        rows.forEach(row => {
            console.log(`ID: ${row.id}, Code: ${row.asset_code}, Name: ${row.name}, Path: ${row.image_path}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkAssetImages();
