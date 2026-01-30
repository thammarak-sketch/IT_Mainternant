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
            const upperSql = sql.trim().toUpperCase();
            const queryType = upperSql.split(' ')[0];
            const hasReturning = upperSql.includes('RETURNING');

            if (isPostgres) {
                // PostgreSQL Query
                db.query(normalizedSql, params)
                    .then(res => {
                        if (queryType === 'SELECT') {
                            resolve([res.rows]);
                        } else {
                            // Normalize insertId: check rows[0] if RETURNING was used
                            const row = res.rows && res.rows[0];
                            const insertId = row ? (row.id || row.insertid || 0) : 0;
                            resolve([{
                                affectedRows: res.rowCount,
                                insertId: insertId
                            }]);
                        }
                    })
                    .catch(err => {
                        console.error(`Postgres Query Error: ${err.message}\nSQL: ${normalizedSql}`);
                        reject(err);
                    });
            } else {
                // SQLite Query
                if (queryType === 'SELECT' || hasReturning) {
                    db.all(sql, params, (err, rows) => {
                        if (err) {
                            console.error(`SQLite Query Error: ${err.message}\nSQL: ${sql}`);
                            return reject(err);
                        }
                        if (hasReturning && queryType === 'INSERT') {
                            resolve([{
                                affectedRows: 1,
                                insertId: rows[0]?.id || rows[0]?.ID || 0
                            }]);
                        } else {
                            resolve([rows]);
                        }
                    });
                } else {
                    db.run(sql, params, function (err) {
                        if (err) {
                            console.error(`SQLite Exec Error: ${err.message}\nSQL: ${sql}`);
                            return reject(err);
                        }
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
