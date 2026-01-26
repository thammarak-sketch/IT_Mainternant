const db = require('./db');

async function addRepairMethod() {
    try {
        console.log("Adding repair_method column to maintenance_logs...");
        await db.query(`ALTER TABLE maintenance_logs ADD COLUMN repair_method TEXT DEFAULT 'internal'`);
        console.log("Column added successfully.");
        process.exit(0);
    } catch (err) {
        if (err.message && err.message.includes('duplicate column name')) {
            console.log("Column already exists.");
            process.exit(0);
        }
        console.error(err);
        process.exit(1);
    }
}

addRepairMethod();
