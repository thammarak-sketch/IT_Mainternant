const db = require('./server/db');

async function debug() {
    try {
        console.log("Checking DB connection...");
        const type = 'Laptop';
        const typePrefix = 'NB'; // Hardcoded for 'Laptop' based on assets.js
        const year = new Date().getFullYear();
        const prefix = `${typePrefix}-${year}-`;

        console.log(`Querying for prefix: ${prefix}`);

        const [rows] = await db.query(
            'SELECT asset_code FROM assets WHERE asset_code LIKE ? ORDER BY asset_code DESC LIMIT 1',
            [`${prefix}%`]
        );

        console.log("Rows returned:", JSON.stringify(rows));

        let nextNumber = 1;
        if (rows.length > 0) {
            const lastCode = rows[0].asset_code;
            console.log("Last code found:", lastCode);
            const parts = lastCode.split('-');
            if (parts.length === 3) {
                const lastNumber = parseInt(parts[2], 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
        }

        const nextCode = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
        console.log("Next Code Generated:", nextCode);

    } catch (err) {
        console.error("DB Error:", err);
    }
}

debug();
