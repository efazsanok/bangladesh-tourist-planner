const express = require('express');
const { param } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { daysInclusive } = require('../utils/dates');
const { getOwnedTrip, getTripItems } = require('../utils/itinerary');
const { rateTripDays, alertsForDay } = require('../utils/suitability');

const router = express.Router();

router.get('/trips/:id/suitability', authenticate, param('id').isInt({ min: 1 }), validate, asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.user.id, req.params.id);
  const items = await getTripItems(trip.id);
  const days = await rateTripDays(trip, items);
  res.json({ days, message: days.length ? null : 'Add destinations to your itinerary to get daily weather ratings.' });
}));

router.get('/alerts', authenticate, asyncHandler(async (req, res) => {
  const [trips] = await pool.query(
    `SELECT * FROM trips WHERE user_id = ? AND end_date >= CURDATE() AND start_date <= DATE_ADD(CURDATE(), INTERVAL 6 DAY) ORDER BY start_date LIMIT 10`,
    [req.user.id]
  );
  const alerts = [];
  for (const trip of trips) {
    trip.days = daysInclusive(trip.start_date, trip.end_date);
    const days = await rateTripDays(trip, await getTripItems(trip.id));
    days.filter((d) => d.source === 'forecast').forEach((d) => {
      alertsForDay(d.weather).forEach((a) => alerts.push({ tripId: trip.id, tripTitle: trip.title, date: d.date, destination: d.destinationName, ...a }));
    });
  }
  res.json({ alerts });
}));

module.exports = router;