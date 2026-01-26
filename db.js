const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const util = require('util');

const dbPath = path.resolve(__dirname, 'data', 'prompt.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Promisify the db.all (for SELECT) and db.run (for INSERT, UPDATE, DELETE)
// verifying standard compatibility wrapper for existing routes
const pool = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            const queryType = sql.trim().split(' ')[0].toUpperCase();

            // Convert MySQL-style '?' placeholders to SQLite-style '?' (Same, good)

            if (queryType === 'SELECT') {
                db.all(sql, params, (err, rows) => {
                    if (err) return reject(err);
                    resolve([rows]); // Return as [rows, fields] format to match mysql2
                });
            } else {
                db.run(sql, params, function (err) {
                    if (err) return reject(err);
                    // Return result object mimicking mysql2
                    resolve([{
                        affectedRows: this.changes,
                        insertId: this.lastID
                    }]);
                });
            }
        });
    }
};

module.exports = pool;
