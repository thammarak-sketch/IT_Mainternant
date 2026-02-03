const db = require('./db');

async function fix() {
    try {
        console.log('Adding software column to assets table...');

        const safeAddColumn = async (tableName, colSql) => {
            try {
                await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${colSql}`);
                console.log(`Added column to ${tableName}: ${colSql}`);
            } catch (err) {
                if (err.message && err.message.includes('duplicate column')) {
                    console.log(`Column already exists in ${tableName}: ${colSql}`);
                } else if (err.message && err.message.includes('no such column')) {
                     // SQLite sometimes gives different errors, but 'duplicate column' is the key one for existing.
                     console.log(`Column likely exists (error: ${err.message})`);
                } else {
                    console.error(`Failed to add ${colSql} to ${tableName}:`, err.message);
                }
            }
        };

        await safeAddColumn("assets", "software TEXT");

        console.log('Schema update complete.');
    } catch (err) {
        console.error('Update failed:', err);
    }
}

fix();
