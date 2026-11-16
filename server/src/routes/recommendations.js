const express = require('express');
const { body } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { DATE_RE, todayStr } = require('../utils/dates');
const { loadCostData, estimate } = require('../utils/costing');
const { getMonthly, MONTH_NAMES } = require('../utils/climate');

const router = express.Router();
const CATEGORIES = ['beach', 'hill', 'heritage', 'nature'];

router.post(
  '/recommendations',
  [
    body('budget').isInt({ min: 500, max: 100000000 }).withMessage('Budget must be at least 500'),
    body('days').isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30'),
    body('travelers').isInt({ min: 1, max: 50 }).withMessage('Travelers must be between 1 and 50'),
    body('interests').optional().isArray({ max: 4 }).withMessage('Invalid interests'),
    body('interests.*').isIn(CATEGORIES).withMessage('Invalid interest'),
    body('month').optional({ values: 'falsy' }).isInt({ min: 1, max: 12 }),
    body('start_date').optional({ values: 'falsy' }).matches(DATE_RE).withMessage('Date must be YYYY-MM-DD'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const budget = Number(req.body.budget);
    const days = Number(req.body.days);
    const travelers = Number(req.body.travelers);
    const interests = req.body.interests || [];
    const month = req.body.start_date
      ? Number(req.body.start_date.slice(5, 7))
      : Number(req.body.month || todayStr().slice(5, 7));

    const [dests] = await pool.query('SELECT id, name, division, category, image_url, budget_level FROM destinations');
    const results = [];
    const excluded = { overBudget: 0, poorWeather: 0 };

    for (const d of dests) {
      const data = await loadCostData(d.id);
      const modes = Object.entries(data.transport).sort((a, b) => a[1] - b[1]);
      if (!modes.length) continue;
      const hotelCategory = data.hotels.standard !== undefined ? 'standard' : Object.keys(data.hotels)[0];
      if (!hotelCategory) continue;

      const cost = estimate(data, { travelers, days, transportMode: modes[0][0], hotelCategory, activityLevel: 'standard' });
      const monthly = (await getMonthly(d.id)).find((m) => m.month === month);
      const weatherScore = monthly ? monthly.score : 50;

      if (cost.total > budget) { excluded.overBudget++; continue; }
      if (monthly && monthly.rating === 'Poor') { excluded.poorWeather++; continue; }

      const interestScore = interests.length ? (interests.includes(d.category) ? 100 : 30) : 60;
      const budgetScore = Math.max(0, 100 - (cost.total / budget) * 60);
      const rank = Math.round(weatherScore * 0.45 + interestScore * 0.35 + budgetScore * 0.2);

      const reasons = [
        `Estimated cost BDT ${cost.total.toLocaleString('en-US')} (${modes[0][0]}, ${hotelCategory} hotel) fits your budget`,
        `${MONTH_NAMES[month - 1]} weather: ${monthly ? monthly.rating : 'unknown'} (${weatherScore}/100)`,
      ];
      if (interests.includes(d.category)) reasons.push(`Matches your interest in ${d.category}`);
      results.push({
        id: d.id, name: d.name, division: d.division, category: d.category, image_url: d.image_url,
        estimatedCost: cost.total, transportMode: modes[0][0], hotelCategory, weatherScore, rank, reasons,
      });
    }
    results.sort((a, b) => b.rank - a.rank);

    res.json({ month: MONTH_NAMES[month - 1], results, excluded });
  })
);

module.exports = router;
