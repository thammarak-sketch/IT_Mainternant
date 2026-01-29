const db = require('./db');

async function migrate() {
    try {
        console.log('Running migration: Update registration_emails table...');

        // SQLite doesn't support ADD COLUMN IF NOT EXISTS easily, 
        // but for this new table we can just recreate it or try to add columns

        // Better approach for development: ensure columns exist
        const columns = [
            { name: 'fullname', type: 'TEXT' },
            { name: 'position', type: 'TEXT' },
            { name: 'department', type: 'TEXT' }
        ];

        for (const col of columns) {
            try {
                await db.query(`ALTER TABLE registration_emails ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added column ${col.name} ✅`);
            } catch (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`Column ${col.name} already exists, skipping.`);
                } else {
                    console.error(`Error adding column ${col.name}:`, err.message);
                }
            }
        }

        console.log('Migration successful! ✅');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
