const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Get stats
router.get('/stats', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.id, c.name, COUNT(p.id) as count 
            FROM categories c 
            LEFT JOIN prompts p ON c.id = p.category_id 
            GROUP BY c.id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Create Category
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
        res.json({ message: 'Category created' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Update Category
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;
        await pool.query('UPDATE categories SET name=? WHERE id=?', [name, req.params.id]);
        res.json({ message: 'Category updated' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete Category
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
