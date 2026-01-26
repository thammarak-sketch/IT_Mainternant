const db = require('./server/db');

async function listAssets() {
    try {
        const [rows] = await db.query('SELECT id, asset_code FROM assets');
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAssets();
