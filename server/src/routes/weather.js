const express = require('express');
const { param } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { fetchForecast } = require('../utils/weatherClient');

const router = express.Router();

router.get(
  '/destinations/:id/weather',
  param('id').isInt({ min: 1 }),
  validate,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT id, name, latitude, longitude FROM destinations WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Destination not found' });
    const dest = rows[0];
    const forecast = await fetchForecast(dest.latitude, dest.longitude);
    res.json({ destination: { id: dest.id, name: dest.name }, ...forecast });
  })
);

module.exports = router;
