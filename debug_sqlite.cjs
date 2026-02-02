const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkSqlite() {
    const dbPath = path.resolve(__dirname, 'server', 'data', 'prompt.db');
    console.log('Opening database:', dbPath);

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            process.exit(1);
        }
        console.log('Connected to SQLite.');

        db.all('SELECT id, asset_code, name, image_path, signature FROM assets ORDER BY id DESC LIMIT 5', [], (err, rows) => {
            if (err) {
                console.error('Error query:', err.message);
            } else {
                console.log('Last 5 Assets:');
                rows.forEach(row => {
                    console.log(`ID: ${row.id}, Code: ${row.asset_code}, Name: ${row.name}`);
                    console.log(`- Image Path: ${row.image_path}`);
                    console.log(`- Signature Length: ${row.signature ? row.signature.length : 0}`);
                    console.log('---');
                });
            }
            db.close();
        });
    });
}

checkSqlite();
