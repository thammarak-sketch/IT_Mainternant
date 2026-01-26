const db = require('./db');

async function fixAssetDates() {
    try {
        console.log("Fixing integer purchase_date in assets...");
        await db.query(`UPDATE assets SET purchase_date = datetime(purchase_date / 1000, 'unixepoch') WHERE typeof(purchase_date) = 'integer'`);
        console.log("Fixed asset dates.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixAssetDates();
