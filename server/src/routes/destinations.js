// Member 2 - Destination Browsing & Search
const express = require('express');
const { query, param } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');

const router = express.Router();

router.get(
  '/destinations',
  [
    query('category').optional({ values: 'falsy' }).isIn(['beach', 'hill', 'heritage', 'nature']),
    query('season').optional({ values: 'falsy' }).isIn(['winter', 'summer', 'monsoon', 'year_round']),
    query('budget').optional({ values: 'falsy' }).isIn(['low', 'medium', 'high']),
    query('search').optional().isLength({ max: 100 }),
    query('division').optional().isLength({ max: 50 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { search, division, category, season, budget } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);

    const where = [];
    const params = [];
    if (search) {
      where.push('(d.name LIKE ? OR d.description LIKE ? OR d.division LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (division) { where.push('d.division = ?'); params.push(division); }
    if (category) { where.push('d.category = ?'); params.push(category); }
    if (season) { where.push("d.best_season IN (?, 'year_round')"); params.push(season); }
    if (budget) { where.push('d.budget_level = ?'); params.push(budget); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM destinations d ${clause}`, params);
    const [rows] = await pool.query(
      `SELECT d.id, d.name, d.division, d.category, d.best_season, d.budget_level, d.image_url,
              LEFT(d.description, 160) AS summary
         FROM destinations d ${clause}
        ORDER BY d.name LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ data: rows, page, limit, total });
  })
);

router.get(
  '/destinations/:id',
  param('id').isInt({ min: 1 }),
  validate,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM destinations WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Destination not found' });
    const destination = rows[0];

    const [attractions] = await pool.query('SELECT id, name, description, is_outdoor, est_cost FROM attractions WHERE destination_id = ? ORDER BY name', [id]);
    const [hotels] = await pool.query('SELECT id, name, category, price_per_night FROM hotels WHERE destination_id = ? ORDER BY price_per_night', [id]);
    const [transport] = await pool.query('SELECT mode, cost_per_person FROM transport_costs WHERE destination_id = ? ORDER BY cost_per_person', [id]);

    destination.gallery = destination.gallery_urls
      ? destination.gallery_urls.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    res.json({ destination, attractions, hotels, transport });
  })
);

module.exports = router;
