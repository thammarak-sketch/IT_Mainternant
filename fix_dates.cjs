const db = require('./db');

async function fixDates() {
    try {
        console.log("Fixing integer dates...");
        await db.query(`UPDATE maintenance_logs SET created_at = datetime(created_at / 1000, 'unixepoch') WHERE typeof(created_at) = 'integer'`);
        console.log("Fixed dates.");
    } catch (err) {
        console.error(err);
    }
}

fixDates();
