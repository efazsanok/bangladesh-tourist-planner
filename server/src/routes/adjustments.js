// Member 2 - Weather-Aware Itinerary Adjustment
const express = require('express');
const { body, param } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { addDays } = require('../utils/dates');
const { fetchForecast } = require('../utils/weatherClient');
const { getOwnedTrip, getTripItems, findConflict } = require('../utils/itinerary');

let rateTripDays;
try {
  ({ rateTripDays } = require('../utils/suitability'));
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') throw err;

  // Fallback rating engine used until Member 3's suitability utility is merged to main
  const LEVELS = ['Good', 'Caution', 'Avoid'];

  function rateDay(w) {
    const rainMm = w.rainMm ?? 0;
    const rainChance = w.rainChance ?? 0;
    const wind = w.wind ?? 0;
    const tempMax = w.tempMax ?? 28;
    let level = 0;
    const reasons = [];
    const raise = (l, msg) => {
      level = Math.max(level, l);
      reasons.push(msg);
    };

    if (rainMm >= 50 || (rainChance >= 80 && rainMm >= 25)) raise(2, 'Very heavy rain expected');
    else if (rainChance >= 50 || rainMm >= 10) raise(1, 'Rain is likely');
    if (wind >= 60) raise(2, 'Storm-force winds');
    else if (wind >= 35) raise(1, 'Strong winds');
    if (tempMax >= 40) raise(2, 'Dangerous heat');
    else if (tempMax >= 36) raise(1, 'Very hot');
    else if (tempMax <= 8) raise(1, 'Very cold');

    return { rating: LEVELS[level], reasons: reasons.length ? reasons : ['Conditions look fine'] };
  }

  async function climateEstimate(destinationId, date) {
    const month = Number(date.slice(5, 7));
    const [rows] = await pool.query(
      'SELECT * FROM climate_monthly WHERE destination_id = ? AND month = ?',
      [destinationId, month]
    );
    if (!rows.length) return { tempMax: 30, rainChance: 20, rainMm: 2, wind: 10 };
    const c = rows[0];
    return {
      tempMax: Math.round(c.avg_temp_c + 3),
      rainChance: Math.min(95, Math.round(c.avg_rainfall_mm / 6)),
      rainMm: Math.round(c.avg_rainfall_mm / 30),
      wind: 10,
    };
  }

  rateTripDays = async function rateTripDaysFallback(trip, items) {
    if (!items.length) return [];
    const counts = {};
    items.forEach((i) => {
      counts[i.destination_id] = (counts[i.destination_id] || 0) + 1;
    });
    const primary = Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]);
    const destIds = Object.keys(counts).map(Number);
    const [dests] = await pool.query(
      'SELECT id, name, latitude, longitude FROM destinations WHERE id IN (?)',
      [destIds]
    );
    const destMap = Object.fromEntries(dests.map((d) => [d.id, d]));

    const forecasts = {};
    await Promise.all(
      dests.map(async (d) => {
        try {
          forecasts[d.id] = await fetchForecast(d.latitude, d.longitude);
        } catch (e) {
          forecasts[d.id] = null;
        }
      })
    );

    const days = [];
    for (let day = 1; day <= trip.days; day++) {
      const date = addDays(trip.start_date, day - 1);
      const firstItem = items.find((i) => i.day_number === day);
      const destId = firstItem ? firstItem.destination_id : primary;
      const live = forecasts[destId]?.daily.find((x) => x.date === date);
      const weather = live || (await climateEstimate(destId, date));
      const { rating, reasons } = rateDay(weather);
      days.push({
        day,
        date,
        destinationId: destId,
        destinationName: destMap[destId]?.name || '',
        rating,
        reasons,
        source: live ? 'forecast' : 'climate',
        weather: {
          tempMax: weather.tempMax,
          rainChance: weather.rainChance,
          rainMm: weather.rainMm,
          wind: weather.wind,
        },
      });
    }
    return days;
  };
}

const router = express.Router();
const idParam = param('id').isInt({ min: 1 });

// Lists outdoor activities planned on Caution/Avoid days, with alternatives for each.
router.get(
  '/trips/:id/adjustments',
  authenticate,
  idParam,
  validate,
  asyncHandler(async (req, res) => {
    const trip = await getOwnedTrip(req.user.id, req.params.id);
    const items = await getTripItems(trip.id);
    const days = await rateTripDays(trip, items);
    const dayInfo = Object.fromEntries(days.map((d) => [d.day, d]));
    const goodDays = days.filter((d) => d.rating === 'Good');

    const adjustments = [];
    for (const item of items) {
      const info = dayInfo[item.day_number];
      if (item.activity_type !== 'outdoor' || !info || info.rating === 'Good') continue;

      const options = [];
      const [indoor] = await pool.query(
        'SELECT id, name, est_cost FROM attractions WHERE destination_id = ? AND is_outdoor = 0 ORDER BY name LIMIT 3',
        [item.destination_id]
      );
      indoor.forEach((a) =>
        options.push({
          type: 'replace',
          attractionId: a.id,
          label: `Swap for indoor activity: ${a.name}`,
        })
      );

      for (const g of goodDays.filter((d) => d.day !== item.day_number).slice(0, 2)) {
        const clash = await findConflict(
          trip.id,
          g.day,
          item.start_time,
          item.title,
          item.destination_id,
          item.id
        );
        if (!clash) {
          options.push({
            type: 'move',
            day: g.day,
            label: `Move to Day ${g.day} (${g.date}) - weather looks good`,
          });
        }
      }

      adjustments.push({
        itemId: item.id,
        title: item.title,
        day: item.day_number,
        date: info.date,
        rating: info.rating,
        reasons: info.reasons,
        options,
      });
    }

    res.json({ adjustments });
  })
);

// Applies one suggestion (the user clicked "Accept").
router.post(
  '/trips/:id/adjustments/apply',
  authenticate,
  idParam,
  body('item_id').isInt({ min: 1 }),
  body('type').isIn(['replace', 'move']).withMessage('Invalid adjustment type'),
  body('attraction_id').optional({ values: 'null' }).isInt({ min: 1 }),
  body('day').optional({ values: 'null' }).isInt({ min: 1, max: 60 }),
  validate,
  asyncHandler(async (req, res) => {
    const trip = await getOwnedTrip(req.user.id, req.params.id);
    const { item_id, type, attraction_id, day } = req.body;
    const [rows] = await pool.query('SELECT * FROM itinerary_items WHERE id = ? AND trip_id = ?', [
      item_id,
      trip.id,
    ]);
    if (!rows.length) throw httpError(404, 'Itinerary item not found');
    const item = rows[0];

    if (type === 'replace') {
      if (!attraction_id) throw httpError(400, 'Attraction is required');
      const [a] = await pool.query('SELECT * FROM attractions WHERE id = ? AND destination_id = ?', [
        attraction_id,
        item.destination_id,
      ]);
      if (!a.length) throw httpError(400, 'Attraction not found for this destination');

      const clash = await findConflict(
        trip.id,
        item.day_number,
        item.start_time,
        a[0].name,
        item.destination_id,
        item.id
      );
      if (clash) throw httpError(409, clash);

      await pool.query(
        "UPDATE itinerary_items SET attraction_id = ?, title = ?, activity_type = 'indoor', est_cost = ? WHERE id = ?",
        [a[0].id, a[0].name, a[0].est_cost, item.id]
      );
    } else {
      if (!day || day > trip.days) throw httpError(400, `Day must be between 1 and ${trip.days}`);
      const clash = await findConflict(
        trip.id,
        day,
        item.start_time,
        item.title,
        item.destination_id,
        item.id
      );
      if (clash) throw httpError(409, clash);

      const [[{ next }]] = await pool.query(
        'SELECT COALESCE(MAX(position), 0) + 1 AS next FROM itinerary_items WHERE trip_id = ? AND day_number = ?',
        [trip.id, day]
      );
      await pool.query('UPDATE itinerary_items SET day_number = ?, position = ? WHERE id = ?', [
        day,
        next,
        item.id,
      ]);
    }

    res.json({ message: 'Itinerary updated' });
  })
);

module.exports = router;
