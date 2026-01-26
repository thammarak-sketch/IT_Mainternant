const db = require('./db');

async function updateSchema() {
    try {
        console.log('Adding missing columns to maintenance_logs...');

        // Add technician_name
        try {
            await db.query(`ALTER TABLE maintenance_logs ADD COLUMN technician_name TEXT`);
            console.log('Added technician_name column.');
        } catch (e) {
            if (!e.message.includes('duplicate column')) console.error('Error adding technician_name:', e.message);
        }

        // Add started_at
        try {
            await db.query(`ALTER TABLE maintenance_logs ADD COLUMN started_at DATETIME`);
            console.log('Added started_at column.');
        } catch (e) {
            if (!e.message.includes('duplicate column')) console.error('Error adding started_at:', e.message);
        }

        // Add completed_at
        try {
            await db.query(`ALTER TABLE maintenance_logs ADD COLUMN completed_at DATETIME`);
            console.log('Added completed_at column.');
        } catch (e) {
            if (!e.message.includes('duplicate column')) console.error('Error adding completed_at:', e.message);
        }

        // Add service_type
        try {
            await db.query(`ALTER TABLE maintenance_logs ADD COLUMN service_type TEXT DEFAULT 'repair'`);
            console.log('Added service_type column.');
        } catch (e) {
            if (!e.message.includes('duplicate column')) console.error('Error adding service_type:', e.message);
        }

        // Add created_at
        try {
            await db.query(`ALTER TABLE maintenance_logs ADD COLUMN created_at DATETIME`);
            console.log('Added created_at column.');
            await db.query(`UPDATE maintenance_logs SET created_at = log_date WHERE created_at IS NULL`);
            console.log('Backfilled created_at with log_date.');
        } catch (e) {
            if (!e.message.includes('duplicate column')) console.error('Error adding created_at:', e.message);
        }

        console.log('Schema update complete.');
        process.exit(0);
    } catch (err) {
        console.error('Schema Update Failed:', err);
        process.exit(1);
    }
}

updateSchema();
