const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// GET all users
router.get('/', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, fullname, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
});

// POST create user
router.post('/', async (req, res) => {
    try {
        const { username, password, role, fullname } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, password, role, fullname) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, role || 'staff', fullname || '']
        );

        res.status(201).json({ id: result[0].insertId, message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create user', details: err.message });
    }
});

// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// PUT update user (including password reset)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role, fullname } = req.body;

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (username) {
            updates.push('username = ?');
            values.push(username);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }
        if (role) {
            updates.push('role = ?');
            values.push(role);
        }
        if (fullname !== undefined) {
            updates.push('fullname = ?');
            values.push(fullname);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, values);

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user', details: err.message });
    }
});

module.exports = router;
