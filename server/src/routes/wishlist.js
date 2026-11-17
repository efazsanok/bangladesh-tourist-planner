const express = require('express');
const { param } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const destParam = param('destinationId').isInt({ min: 1 });

router.get('/wishlist', authenticate, asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
    `SELECT d.id, d.name, d.division, d.category, d.budget_level, d.image_url, LEFT(d.description, 140) AS summary, w.created_at 
    FROM wishlist w JOIN destinations d ON d.id = w.destination_id 
    WHERE w.user_id = ? ORDER BY w.created_at DESC`,
    [req.user.id]
    );
    res.json({ data: rows });
}));

router.post('/wishlist/:destinationId', authenticate, destParam, validate, asyncHandler(async (req, res) => {
    const [dest] = await pool.query('SELECT id FROM destinations WHERE id = ?', [req.params.destinationId]);
    if (!dest.length) return res.status(404).json({ message: 'Destination not found' });
    await pool.query('INSERT IGNORE INTO wishlist (user_id, destination_id) VALUES (?, ?)', [req.user.id,
    req.params.destinationId]);
    res.status(201).json({ message: 'Saved to wishlist' });
}));

router.delete('/wishlist/:destinationId', authenticate, destParam, validate, asyncHandler(async (req, res)=> {
    await pool.query('DELETE FROM wishlist WHERE user_id = ? AND destination_id = ?', [req.user.id,
    req.params.destinationId]);
    res.json({ message: 'Removed from wishlist' });
}));

module.exports = router; 