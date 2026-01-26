const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken'); // Implementing basic check for now

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt for: ${username}`);

        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            console.log('User not found in database');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        console.log(`Password check result: ${validPassword}`);

        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate Token (Simplified for now, just success)
        // const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
