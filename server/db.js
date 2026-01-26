const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let db;
let isPostgres = false;

if (process.env.DATABASE_URL) {
    // Production: PostgreSQL
    isPostgres = true;
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log('Connected to PostgreSQL database.');
} else {
    // Development: SQLite
    const dbPath = path.resolve(__dirname, 'data', 'prompt.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database ' + dbPath + ': ' + err.message);
        } else {
            console.log('Connected to the SQLite database.');
            db.run('PRAGMA foreign_keys = ON');
        }
    });
}

// Helper to convert SQLite '?' params to Postgres '$1, $2'
const convertQuery = (sql) => {
    if (!isPostgres) return sql;
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
};

const pool = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            const normalizedSql = convertQuery(sql);

            if (isPostgres) {
                // PostgreSQL Query
                db.query(normalizedSql, params)
                    .then(res => {
                        // Normalize result to match our app's expectation [rows, fields]
                        // INSERT/UPDATE returns different structure in pg vs sqlite wrapper
                        if (sql.trim().toUpperCase().startsWith('SELECT')) {
                            resolve([res.rows]);
                        } else {
                            // Validating insertId for Postgres usually requires RETURNING id
                            // For now, we simulate basic success response
                            // Ideally, queries should be updated to use RETURNING id
                            resolve([{
                                affectedRows: res.rowCount,
                                insertId: res.rows[0]?.id || 0 // Warning: requries RETURNING id in SQL
                            }]);
                        }
                    })
                    .catch(reject);
            } else {
                // SQLite Query (Original Logic)
                const queryType = sql.trim().split(' ')[0].toUpperCase();
                if (queryType === 'SELECT') {
                    db.all(sql, params, (err, rows) => {
                        if (err) return reject(err);
                        resolve([rows]);
                    });
                } else {
                    db.run(sql, params, function (err) {
                        if (err) return reject(err);
                        resolve([{
                            affectedRows: this.changes,
                            insertId: this.lastID
                        }]);
                    });
                }
            }
        });
    }
};

module.exports = pool;
