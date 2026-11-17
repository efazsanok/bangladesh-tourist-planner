const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { loadCostData, estimate } = require('../utils/costing');

const router = express.Router();

router.post(
  '/budget/estimate',
  [
    body('destination_id').isInt({ min: 1 }).withMessage('Choose a destination'),
    body('travelers').isInt({ min: 1, max: 50 }).withMessage('Travelers must be between 1 and 50'),
    body('days').isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30'),
    body('transport_mode').isIn(['bus', 'train', 'air', 'launch']).withMessage('Choose a transport mode'),
    body('hotel_category').isIn(['budget', 'standard', 'luxury']).withMessage('Choose a hotel category'),
    body('activity_level').optional().isIn(['none', 'standard', 'premium']).withMessage('Invalid activity level'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const data = await loadCostData(Number(b.destination_id));
    if (!data) return res.status(404).json({ message: 'Destination not found' });
    const result = estimate(data, {
      travelers: Number(b.travelers), days: Number(b.days),
      transportMode: b.transport_mode, hotelCategory: b.hotel_category, activityLevel: b.activity_level,
    });
    res.json({ destination: { id: data.dest.id, name: data.dest.name }, ...result });
  })
);

module.exports = router;