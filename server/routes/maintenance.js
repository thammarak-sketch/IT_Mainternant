const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all maintenance logs
router.get('/', async (req, res) => {
    try {
        const { date } = req.query;
        const params = [];
        let query = `
            SELECT m.*, a.asset_code, a.name as asset_name, a.type as asset_type, a.email, a.is_pc, a.is_mobile
            FROM maintenance_logs m
            LEFT JOIN assets a ON m.asset_id = a.id
        `;

        if (date) {
            // Filter by date (YYYY-MM-DD) with safer logic
            query += ` WHERE (m.created_at IS NOT NULL AND DATE(m.created_at) = ?) OR (m.created_at IS NULL AND DATE(m.log_date) = ?)`;
            params.push(date, date);
        } else if (req.query.asset_id) {
            // Filter by asset_id
            query += ` WHERE m.asset_id = ?`;
            params.push(req.query.asset_id);
        }

        query += ` ORDER BY COALESCE(m.created_at, m.log_date) DESC, m.status ASC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ error: 'Failed to fetch maintenance logs', details: err.message });
    }
});

// CREATE maintenance log
router.post('/', async (req, res) => {
    try {
        const { asset_id, description, cost, log_date, reporter_name, contact_info, department, service_type, new_employee_name, asset_type, email, is_pc, is_mobile } = req.body;

        let finalAssetId = asset_id;

        // Handle 'new_setup' logic: Create Asset first
        if (service_type === 'new_setup') {
            if (!new_employee_name || !asset_type) {
                return res.status(400).json({ error: 'Employee Name and Asset Type are required for New Setup' });
            }

            const currentYear = new Date().getFullYear();
            const prefix = `IT-${currentYear}-`;

            // Find last asset code for this year
            const [lastAsset] = await db.query(
                `SELECT asset_code FROM assets WHERE asset_code LIKE ? ORDER BY id DESC LIMIT 1`,
                [`${prefix}%`]
            );

            let sequence = 1;
            if (lastAsset.length > 0) {
                const lastCode = lastAsset[0].asset_code;
                const parts = lastCode.split('-');
                if (parts.length === 3 && !isNaN(parts[2])) {
                    sequence = parseInt(parts[2], 10) + 1;
                }
            }

            const newAssetCode = `${prefix}${String(sequence).padStart(3, '0')}`;
            const newAssetName = `New ${asset_type} for ${new_employee_name}`;

            const assetSql = `
                INSERT INTO assets (asset_code, name, type, brand, model, status, location, purchase_date, email, is_pc, is_mobile)
                VALUES (?, ?, ?, 'Generic', 'Generic', 'assigned', ?, ?, ?, ?, ?)
            `;

            const assetResult = await db.query(assetSql, [
                newAssetCode, newAssetName, asset_type, department || 'IT', new Date().toISOString(),
                email || null, is_pc ? 1 : 0, is_mobile ? 1 : 0
            ]);

            finalAssetId = assetResult[0].insertId;
        }

        if (!finalAssetId && service_type !== 'new_setup') {
            return res.status(400).json({ error: 'Asset is required' });
        }

        const sql = `
            INSERT INTO maintenance_logs (asset_id, description, cost, log_date, status, reporter_name, contact_info, department, service_type, repair_method, created_at)
            VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.query(sql, [
            finalAssetId, description, cost, log_date || new Date().toISOString(),
            reporter_name, contact_info, department, service_type || 'repair', req.body.repair_method || 'internal', new Date().toISOString()
        ]);

        if (service_type === 'repair' || !service_type) {
            await db.query(`UPDATE assets SET status = 'repair' WHERE id = ?`, [finalAssetId]);
        }

        // Send LINE Notification
        try {
            const { sendLineNotification } = require('../services/lineNotify');

            // Fetch asset_code for better notification
            let assetCode = 'N/A';
            if (finalAssetId) {
                const [assetRows] = await db.query('SELECT asset_code FROM assets WHERE id = ?', [finalAssetId]);
                if (assetRows.length > 0) {
                    assetCode = assetRows[0].asset_code;
                }
            }

            const notifyMsg = `🔔 มีการแจ้งซ่อมใหม่!\n\nรหัสทรัพย์สิน: ${assetCode}\nอาการ: ${description}\nผู้แจ้ง: ${reporter_name}\n\nตรวจสอบรายละเอียดได้ที่เว็บไซต์`;
            await sendLineNotification(notifyMsg);
        } catch (notifyErr) {
            console.error('Failed to send notification:', notifyErr.message);
        }

        res.status(201).json({ id: result[0].insertId, message: 'Maintenance log added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add maintenance log', details: err.message });
    }
});

// UPDATE maintenance log
router.put('/:id', async (req, res) => {
    try {
        const { status, cost, description } = req.body;

        let sql = 'UPDATE maintenance_logs SET ';
        const params = [];
        const updates = [];

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (cost !== undefined) {
            updates.push('cost = ?');
            params.push(cost);
        }
        if (description) {
            updates.push('description = ?');
            params.push(description);
        }
        if (req.body.technician_name) {
            updates.push('technician_name = ?');
            params.push(req.body.technician_name);
        }
        if (req.body.started_at) {
            updates.push('started_at = ?');
            params.push(req.body.started_at);
        }
        if (req.body.completed_at) {
            updates.push('completed_at = ?');
            params.push(req.body.completed_at);
        }
        if (req.body.signature) {
            updates.push('signature = ?');
            params.push(req.body.signature);
        }
        if (req.body.repair_method) {
            updates.push('repair_method = ?');
            params.push(req.body.repair_method);
        }
        if (req.body.signer_name) {
            updates.push('signer_name = ?');
            params.push(req.body.signer_name);
        }

        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

        sql += updates.join(', ') + ' WHERE id = ?';
        params.push(req.params.id);

        await db.query(sql, params);

        res.json({ message: 'Maintenance log updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update maintenance log' });
    }
});

// DELETE maintenance log
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM maintenance_logs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Maintenance log deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete maintenance log' });
    }
});

module.exports = router;
