const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all emails
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM registration_emails';
        const params = [];

        if (search) {
            query += ' WHERE email LIKE ? OR fullname LIKE ? OR position LIKE ? OR department LIKE ? OR notes LIKE ?';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

// CREATE email registration
router.post('/', async (req, res) => {
    try {
        const { email, fullname, position, department, is_pc, is_mobile, notes } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const sql = `
            INSERT INTO registration_emails (email, fullname, position, department, is_pc, is_mobile, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.query(sql, [
            email,
            fullname || null,
            position || null,
            department || null,
            is_pc ? 1 : 0,
            is_mobile ? 1 : 0,
            notes || null
        ]);

        res.status(201).json({ id: result[0].insertId, message: 'Email registered successfully' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'This email is already registered' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to register email' });
    }
});

// UPDATE email registration
router.put('/:id', async (req, res) => {
    try {
        const { email, fullname, position, department, is_pc, is_mobile, notes } = req.body;

        const sql = `
            UPDATE registration_emails 
            SET email = ?, fullname = ?, position = ?, department = ?, is_pc = ?, is_mobile = ?, notes = ?
            WHERE id = ?
        `;
        await db.query(sql, [
            email,
            fullname || null,
            position || null,
            department || null,
            is_pc ? 1 : 0,
            is_mobile ? 1 : 0,
            notes || null,
            req.params.id
        ]);

        res.json({ message: 'Email registration updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update email record' });
    }
});

// DELETE email registration
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM registration_emails WHERE id = ?', [req.params.id]);
        res.json({ message: 'Email registration deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete email record' });
    }
});

module.exports = router;
