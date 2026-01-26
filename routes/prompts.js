const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all prompts
router.get('/', async (req, res) => {
    try {
        const { search, category, sort } = req.query;
        let query = `
            SELECT p.*, c.name as category_name 
            FROM prompts p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += " AND p.title LIKE ?";
            params.push(`%${search}%`);
        }
        if (category) {
            query += " AND p.category_id = ?";
            params.push(category);
        }

        if (sort === 'oldest') {
            query += " ORDER BY p.created_at ASC";
        } else if (sort === 'views') {
            query += " ORDER BY p.views DESC";
        } else {
            query += " ORDER BY p.created_at DESC";
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get single prompt
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM prompts p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
        `, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });

        await pool.query('UPDATE prompts SET views = views + 1 WHERE id = ?', [req.params.id]);
        const [gallery] = await pool.query('SELECT * FROM gallery_images WHERE prompt_id = ?', [req.params.id]);

        res.json({ ...rows[0], gallery });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Create prompt
router.post('/', async (req, res) => {
    try {
        const { title, content, category_id, cover_image, url, gallery } = req.body;
        const [result] = await pool.query(
            'INSERT INTO prompts (title, content, category_id, cover_image, url) VALUES (?, ?, ?, ?, ?)',
            [title, content, category_id, cover_image, url]
        );

        const promptId = result.insertId;

        // Insert gallery images if provided (array of URLs)
        if (gallery && gallery.length > 0) {
            const values = gallery.map(imgUrl => [promptId, imgUrl]);
            await pool.query('INSERT INTO gallery_images (prompt_id, image_path) VALUES ?', [values]);
        }

        res.json({ id: promptId, message: 'Prompt created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update prompt
router.put('/:id', async (req, res) => {
    try {
        const { title, content, category_id, cover_image, url } = req.body;
        await pool.query(
            'UPDATE prompts SET title=?, content=?, category_id=?, cover_image=?, url=? WHERE id=?',
            [title, content, category_id, cover_image, url, req.params.id]
        );
        res.json({ message: 'Prompt updated' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete prompt
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM prompts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Prompt deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
