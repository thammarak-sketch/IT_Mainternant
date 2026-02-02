async function checkAssetImages() {
    try {
        // Use dynamic import for ES module compatibility
        const dbModule = await import('./server/db.js');
        const db = dbModule.default;

        const [rows] = await db.query('SELECT id, asset_code, name, image_path, signature FROM assets ORDER BY id DESC LIMIT 5');
        console.log('Last 5 Assets (Database State):');
        console.log('-------------------------------');
        rows.forEach(row => {
            console.log(`ID: ${row.id}`);
            console.log(`Code: ${row.asset_code}`);
            console.log(`Name: ${row.name}`);
            console.log(`Image Path: ${row.image_path}`);
            console.log(`Signature Length: ${row.signature ? row.signature.length : 0} characters`);
            if (row.signature && row.signature.startsWith('http')) {
                console.log(`Signature URL: ${row.signature}`);
            }
            console.log('-------------------------------');
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkAssetImages();
