const db = require('./server/db');

async function listAssets() {
    try {
        console.log("Querying assets...");
        const [rows] = await db.query('SELECT id, asset_code FROM assets');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAssets();
