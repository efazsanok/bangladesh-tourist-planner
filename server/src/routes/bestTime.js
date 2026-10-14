const express = require('express');
const { param, query } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { addDays } = require('../utils/dates');
const { getOwnedTrip, getTripItems } = require('../utils/itinerary');
const { MONTH_NAMES, getMonthly, alternativesForMonth } = require('../utils/climate');
const router = express.Router();
router.get(
    '/destinations/:id/best-time',
    param('id').isInt({ min: 1 }),
    query('month').optional().isInt({ min: 1, max: 12 }),
    validate,
    asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        const [dest] = await pool.query('SELECT id, name, category FROM destinations WHERE id = ?', [id]);
        if (!dest.length) return res.status(404).json({ message: 'Destination not found' });
        const months = await getMonthly(id);
        if (!months.length) return res.json({
            destination: dest[0], months: [], bestMonths: [], selected: null,
            advice: null
        });
        const bestMonths = months
            .filter((m) => m.rating === 'Good')
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .sort((a, b) => a.month - b.month);
        let selected = null;
        let advice = null;
        if (req.query.month) {
            selected = months.find((m) => m.month === Number(req.query.month));
            if (selected && selected.rating === 'Poor') {
                advice = {
                    betterMonths: bestMonths.map((m) => m.name),
                    alternatives: await alternativesForMonth(selected.month, id, dest[0].category),
                };
            }
        }
        res.json({ destination: dest[0], months, bestMonths, selected, advice });
    })
);

router.get(
    '/trips/:id/season-check',
    authenticate,
    param('id').isInt({ min: 1 }),
    validate,
    asyncHandler(async (req, res) => {
        const trip = await getOwnedTrip(req.user.id, req.params.id);
        const items = await getTripItems(trip.id);
        const destIds = [...new Set(items.map((i) => i.destination_id))];
        if (!destIds.length) return res.json({
            warnings: [], message: 'Add destinations to your itinerary to check the season.'
        });
        const covered = new Set();
        for (let d = 0; d < trip.days; d++) covered.add(Number(addDays(trip.start_date, d).slice(5, 7)));
        const startMonth = Number(trip.start_date.slice(5, 7));
        const startYear = Number(trip.start_date.slice(0, 4));
        const [dests] = await pool.query('SELECT id, name, category FROM destinations WHERE id IN (?)',
            [destIds]);
        const warnings = [];
        for (const dest of dests) {
            const months = await getMonthly(dest.id);
            const mine = months.filter((m) => covered.has(m.month));
            if (!mine.length) continue;
            const avg = Math.round(mine.reduce((s, m) => s + m.score, 0) / mine.length);
            if (avg >= 50) continue; // not a poor season
            const betterDates = months
                .filter((m) => m.rating === 'Good' && !covered.has(m.month))
                .sort((a, b) => b.score - a.score)
                .slice(0, 2)
                .map((m) => {
                    const year = m.month > startMonth ? startYear : startYear + 1;
                    const start = `${year}-${String(m.month).padStart(2, '0')}-01`;
                    return {
                        month: MONTH_NAMES[m.month - 1], start_date: start, end_date: addDays(start, trip.days -
                            1), score: m.score
                    };
                });
            const alternatives = await alternativesForMonth(startMonth, dest.id, dest.category);
            warnings.push({
                destinationId: dest.id, destination: dest.name, score: avg,
                message: `${dest.name} has a poor weather season during your travel dates (score ${avg}/100).`,
                betterDates, alternatives,
            });
        }
        res.json({ warnings });
    })
);
module.exports = router;
