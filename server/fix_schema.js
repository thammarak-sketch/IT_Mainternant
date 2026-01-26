const db = require('./db');

async function fix() {
    try {
        console.log('Patching Database Schema...');

        // Helper to ignore "duplicate column" errors if they exist
        const safeAddColumn = async (tableName, colSql) => {
            try {
                await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${colSql}`);
                console.log(`Added column to ${tableName}: ${colSql}`);
            } catch (err) {
                if (err.message.includes('duplicate column')) {
                    // console.log(`Column already exists in ${tableName}: ${colSql}`);
                    // Silently ignore
                } else {
                    console.error(`Failed to add ${colSql} to ${tableName}:`, err.message);
                }
            }
        };

        // Maintenance Logs updates
        await safeAddColumn("maintenance_logs", "cost DECIMAL(10, 2)"); // Just in case
        await safeAddColumn("maintenance_logs", "reporter_name TEXT");
        await safeAddColumn("maintenance_logs", "contact_info TEXT");
        await safeAddColumn("maintenance_logs", "department TEXT");
        await safeAddColumn("maintenance_logs", "technician_name TEXT");
        await safeAddColumn("maintenance_logs", "started_at DATETIME");
        await safeAddColumn("maintenance_logs", "completed_at DATETIME");

        // Users updates
        await safeAddColumn("users", "fullname TEXT");
        await safeAddColumn("users", "role TEXT DEFAULT 'staff'");

        console.log('Schema patch complete.');
    } catch (err) {
        console.error('Patch failed:', err);
    }
}

fix();
