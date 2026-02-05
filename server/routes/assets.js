const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToDrive, uploadBase64ToDrive } = require('../utils/googleDriveHelper');

// Configure Multer for File Uploads
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
    }
});

/**
 * Helper to get 2-character prefix based on asset type
 */
const getTypePrefix = (type) => {
    switch (type) {
        case 'Laptop': return 'NB';
        case 'PC': return 'PC';
        case 'AllInOne': return 'AI';
        case 'Monitor': return 'MT';
        case 'Printer': return 'PT';
        case 'Tablet': return 'TB';
        case 'Radio': return 'RD';
        case 'Server': return 'SV';
        case 'Accessory': return 'AC';
        case 'Software': return 'SW';
        default: return 'IT';
    }
};

// GET next asset code (Format: TYPE-YYYY-XXX)
router.get('/next-code', async (req, res) => {
    try {
        console.log("GET /next-code request received for type:", req.query.type);
        const { type } = req.query;
        const typePrefix = getTypePrefix(type);
        const year = new Date().getFullYear();
        const prefix = `${typePrefix}-${year}-`;

        const [rows] = await db.query(
            'SELECT asset_code FROM assets WHERE asset_code LIKE ? ORDER BY asset_code DESC LIMIT 1',
            [`${prefix}%`]
        );

        let nextNumber = 1;
        if (rows.length > 0) {
            const lastCode = rows[0].asset_code;
            const parts = lastCode.split('-');
            // Parts should be [PREFIX, YEAR, NUMBER]
            if (parts.length === 3) {
                const lastNumber = parseInt(parts[2], 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
        }

        const nextCode = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
        res.json({ nextCode });
    } catch (err) {
        console.error("GET NEXT CODE ERROR:", err);
        res.status(500).json({ error: 'Failed to generate next asset code' });
    }
});

// Helper for sanitizing multer inputs (formData makes everything strings)
const sanitize = (val) => {
    if (val === null || val === undefined || val === 'null' || val === 'undefined' || val === '') return null;
    return val;
};

// Helper for boolean checkboxes from FormData
const parseBool = (val) => {
    return (val === '1' || val === 1 || val === true || val === 'true') ? 1 : 0;
};

// GET all assets
router.get('/', async (req, res) => {
    try {
        const { search, type, status, name } = req.query;
        let query = 'SELECT * FROM assets';
        const params = [];
        const conditions = [];

        if (search) {
            conditions.push('(name LIKE ? OR asset_code LIKE ? OR serial_number LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (type) {
            conditions.push('type = ?');
            params.push(type);
        }
        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (name) {
            conditions.push('name = ?');
            params.push(name);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch assets', details: err.message });
    }
});

// GET single asset
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch asset', details: err.message });
    }
});

// CREATE asset
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { asset_code, name, type, brand, model, serial_number, purchase_date, price, status, location, notes, spec, received_date, return_date, email, is_pc, is_mobile, software } = req.body;

        // Handle image path - Upload to Google Drive
        let image_path = null;
        if (req.file) {
            try {
                const driveLink = await uploadToDrive(req.file.buffer, req.file.originalname, req.file.mimetype);
                image_path = driveLink;
            } catch (driveErr) {
                console.error("Google Drive Upload failed, falling back to null:", driveErr);
            }
        }

        // Handle signature - Upload to Google Drive if it's a new signature (Base64)
        let signature = req.body.signature;
        if (signature && signature.startsWith('data:image')) {
            try {
                const sigFileName = `sig_${asset_code || Date.now()}.png`;
                const sigLink = await uploadBase64ToDrive(signature, sigFileName);
                signature = sigLink;
            } catch (sigErr) {
                console.error("Signature upload to Drive failed:", sigErr);
            }
        }

        // Basic validation
        if (!asset_code || !name || !type) {
            return res.status(400).json({ error: 'Asset Code, Name, and Type are required' });
        }

        const sql = `
            INSERT INTO assets (asset_code, name, type, brand, model, serial_number, purchase_date, price, status, location, notes, image_path, assigned_to, signature, spec, received_date, return_date, email, is_pc, is_mobile, software)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.query(sql, [
            sanitize(asset_code), sanitize(name), sanitize(type), sanitize(brand), sanitize(model),
            sanitize(serial_number), sanitize(purchase_date), sanitize(price),
            status || 'available', sanitize(location), sanitize(notes), image_path,
            sanitize(req.body.assigned_to), signature,
            sanitize(req.body.spec), sanitize(req.body.received_date), sanitize(req.body.return_date),
            sanitize(email), parseBool(is_pc), parseBool(is_mobile), sanitize(software)
        ]);

        res.status(201).json({ id: result[0].insertId, message: 'Asset created successfully', image_path });
    } catch (err) {
        console.error("CREATE ASSET ERROR:", err);
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Asset Code must be unique' });
        }
        res.status(500).json({ error: 'Failed to create asset', details: err.message });
    }
});

// UPDATE asset
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { asset_code, name, type, brand, model, serial_number, purchase_date, price, status, location, notes, spec, received_date, return_date, email, is_pc, is_mobile, software } = req.body;
        // Handle image path update
        let image_path_sql = '';
        let image_path_val = null;

        if (req.file) {
            console.log("PUT Image Update: File detected", req.file.originalname, "Size:", req.file.size);
            const driveLink = await uploadToDrive(req.file.buffer, req.file.originalname, req.file.mimetype);
            image_path_sql = ', image_path=?';
            image_path_val = driveLink;
            console.log("PUT Image Update: Drive Link generated", driveLink);
        } else {
            console.log("PUT Update: No new image file detected");
        }

        // Handle signature upload if it's a new Base64 string
        let signature = req.body.signature;
        if (signature && signature.startsWith('data:image')) {
            console.log("PUT Signature Update: New Base64 signature detected");
            try {
                const sigFileName = `sig_${asset_code || Date.now()}.png`;
                const sigLink = await uploadBase64ToDrive(signature, sigFileName);
                signature = sigLink;
                console.log("PUT Signature Update: Drive Link generated", sigLink);
            } catch (sigErr) {
                console.error("Signature update to Drive failed:", sigErr);
            }
        }

        const sql = `
            UPDATE assets 
            SET asset_code=?, name=?, type=?, brand=?, model=?, serial_number=?, purchase_date=?, price=?, status=?, location=?, notes=?, assigned_to=?, signature=?, spec=?, received_date=?, return_date=?, email=?, is_pc=?, is_mobile=?, software=? ${image_path_sql}
            WHERE id = ?
        `;

        const params = [
            sanitize(asset_code), sanitize(name), sanitize(type), sanitize(brand), sanitize(model),
            sanitize(serial_number), sanitize(purchase_date), sanitize(price),
            sanitize(status), sanitize(location), sanitize(notes),
            sanitize(req.body.assigned_to), signature,
            sanitize(req.body.spec), sanitize(req.body.received_date), sanitize(req.body.return_date),
            sanitize(email), parseBool(is_pc), parseBool(is_mobile), sanitize(software)
        ];

        // The following lines are from the provided edit, but they appear to be client-side code.
        // As this is a backend file, I'm interpreting the intent as adding a backend log
        // for when an image is processed, similar to the existing logs.
        // The `if (image)` and `data.append` parts are not applicable here.
        // The instruction also mentioned "add frontend logging", which would be done on the client.
        // For the backend, I'll ensure the image processing logic is robust.
        // The propagation of Drive upload errors has been added above.
        // If the user intended a different backend change, please clarify.

        // Original code context:
        // if (image) {
        //     console.log("Submitting with new image file:", image.name);
        //     data.append('image', image);
        // }
        // params.push(req.params.id);

        if (image_path_val) {
            params.push(image_path_val);
        }
        params.push(req.params.id);

        console.log("PUT Update: Executing SQL query...");
        const result = await db.query(sql, params);
        console.log("PUT Update: Rows affected:", result[0].affectedRows);

        if (result[0].affectedRows === 0) return res.status(404).json({ error: 'Asset not found' });

        res.json({ message: 'Asset updated successfully' });
    } catch (err) {
        console.error("UPDATE ASSET ERROR:", err);
        res.status(500).json({ error: 'Failed to update asset', details: err.message });
    }
});

// DELETE asset
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM assets WHERE id = ?', [req.params.id]);
        res.json({ message: 'Asset deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete asset', details: err.message });
    }
});

module.exports = router;
