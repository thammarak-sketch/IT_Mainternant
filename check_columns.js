const db = require('./db');

async function checkColumns() {
    try {
        const [rows] = await db.query("PRAGMA table_info(maintenance_logs)");
        console.log(rows);
    } catch (err) {
        console.error(err);
    }
}

checkColumns();
