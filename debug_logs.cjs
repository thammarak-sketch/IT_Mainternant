const db = require('./server/db');

async function checkLogs() {
    try {
        console.log("Checking last 5 maintenance logs...");
        const logs = await db.query(`SELECT id, log_date, created_at, typeof(created_at) as type_created, typeof(log_date) as type_log FROM maintenance_logs ORDER BY id DESC LIMIT 5`);
        console.log(logs[0]); // db.query returns [rows] in our wrapper? No, wait.
        // My wrapper in db.js:
        // if SELECT: resolve([rows]) ... wait, let's check db.js again.
        // resolve([rows]);
        // So checking logs[0] gives the array of rows.
    } catch (err) {
        console.error(err);
    }
}

checkLogs();
