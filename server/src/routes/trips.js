const express = require('express');
const { body, param } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { DATE_RE, daysInclusive } = require('../utils/dates');
const { getOwnedTrip, getTripItems, normalizeTime, findConflict } = require('../utils/itinerary');

const router = express.Router();
const idParam = param('id').isInt({ min: 1 });

const tripRules = [
  body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
  body('start_date').matches(DATE_RE).withMessage('Start date must be YYYY-MM-DD'),
  body('end_date').matches(DATE_RE).withMessage('End date must be YYYY-MM-DD').bail().custom((end, { req }) => {
    const days = daysInclusive(req.body.start_date, end);
    if (!(days >= 1)) throw new Error('End date must be on or after the start date');
    if (days > 30) throw new Error('A trip can be at most 30 days long');
    return true;
  }),
  body('travelers').isInt({ min: 1, max: 50 }).withMessage('Travelers must be between 1 and 50'),
  body('total_budget').isInt({ min: 0, max: 100000000 }).withMessage('Budget must be a positive whole number'),
];

const itemRules = [
  body('destination_id').isInt({ min: 1 }).withMessage('Choose a destination'),
  body('attraction_id').optional({ values: 'null' }).isInt({ min: 1 }),
  body('title').trim().isLength({ min: 2, max: 150 }).withMessage('Activity title must be 2-150 characters'),
  body('day_number').isInt({ min: 1, max: 60 }).withMessage('Invalid day'),
  body('activity_type').isIn(['outdoor', 'indoor']).withMessage('Activity type must be outdoor or indoor'),
  body('start_time').optional({ values: 'falsy' }).matches(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/).withMessage('Time must be HH:MM'),
  body('est_cost').optional({ values: 'null' }).isInt({ min: 0, max: 10000000 }).withMessage('Cost must be a positive number'),
  body('notes').optional({ values: 'null' }).isLength({ max: 500 }).withMessage('Notes are too long'),
];

router.get('/trips', authenticate, asyncHandler(async (req, res) => {
  const [trips] = await pool.query(
    `SELECT t.*,
            (SELECT COUNT(*) FROM itinerary_items i WHERE i.trip_id = t.id) AS item_count,
            CASE WHEN t.end_date < CURDATE() THEN 'past'
                 WHEN t.start_date > CURDATE() THEN 'upcoming'
                 ELSE 'ongoing' END AS status
       FROM trips t WHERE t.user_id = ? ORDER BY t.start_date DESC`,
    [req.user.id]
  );
  res.json({ trips });
}));

router.post('/trips', authenticate, tripRules, validate, asyncHandler(async (req, res) => {
  const b = req.body;
  const [r] = await pool.query(
    'INSERT INTO trips (user_id, title, start_date, end_date, travelers, total_budget) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, b.title, b.start_date, b.end_date, b.travelers, b.total_budget]
  );
  const trip = await getOwnedTrip(req.user.id, r.insertId);
  res.status(201).json({ trip });
}));

router.get('/trips/:id', authenticate, idParam, validate, asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.user.id, req.params.id);
  const items = await getTripItems(trip.id);
  res.json({ trip, items });
}));

router.put('/trips/:id', authenticate, idParam, tripRules, validate, asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.user.id, req.params.id);
  const b = req.body;
  const newDays = daysInclusive(b.start_date, b.end_date);
  const [[{ maxDay }]] = await pool.query('SELECT COALESCE(MAX(day_number), 0) AS maxDay FROM itinerary_items WHERE trip_id = ?', [trip.id]);
  if (maxDay > newDays) throw httpError(409, `Remove or move activities after day ${newDays} before shortening the trip`);
  await pool.query(
    'UPDATE trips SET title = ?, start_date = ?, end_date = ?, travelers = ?, total_budget = ? WHERE id = ?',
    [b.title, b.start_date, b.end_date, b.travelers, b.total_budget, trip.id]
  );
  res.json({ trip: await getOwnedTrip(req.user.id, trip.id) });
}));

router.delete('/trips/:id', authenticate, idParam, validate, asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.user.id, req.params.id);
  await pool.query('DELETE FROM trips WHERE id = ?', [trip.id]);
  res.json({ message: 'Trip deleted' });
}));

router.post('/trips/:id/items', authenticate, idParam, itemRules, validate, asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.user.id, req.params.id);
  const b = req.body;
  if (b.day_number > trip.days) throw httpError(400, `Day must be between 1 and ${trip.days}`);
  const [dest] = await pool.query('SELECT id FROM destinations WHERE id = ?', [b.destination_id]);
  if (!dest.length) throw httpError(400, 'Destination not found');

  const time = normalizeTime(b.start_time);
  const conflict = await findConflict(trip.id, b.day_number, time, b.title, b.destination_id);
  if (conflict) throw httpError(409, conflict);

  const [[{ next }]] = await pool.query(
    'SELECT COALESCE(MAX(position), 0) + 1 AS next FROM itinerary_items WHERE trip_id = ? AND day_number = ?',
    [trip.id, b.day_number]
  );
  const [r] = await pool.query(
    `INSERT INTO itinerary_items (trip_id, destination_id, attraction_id, day_number, position, title, activity_type, start_time, est_cost, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [trip.id, b.destination_id, b.attraction_id || null, b.day_number, next, b.title, b.activity_type, time, b.est_cost || 0, b.notes || null]
  );
  res.status(201).json({ id: r.insertId });
}));

router.put(
  '/trips/:id/items/reorder',
  authenticate, idParam,
  body('items').isArray({ min: 1, max: 200 }).withMessage('items must be a list'),
  body('items.*.id').isInt({ min: 1 }),
  body('items.*.day_number').isInt({ min: 1, max: 60 }),
  body('items.*.position').isInt({ min: 0, max: 1000 }),
  validate,
  asyncHandler(async (req, res) => {
    const trip = await getOwnedTrip(req.user.id, req.params.id);
    const items = req.body.items;
    const ids = items.map((i) => i.id);
    const [rows] = await pool.query('SELECT id FROM itinerary_items WHERE trip_id = ? AND id IN (?)', [trip.id, ids]);
    if (rows.length !== new Set(ids).size) throw httpError(400, 'Some items do not belong to this trip');
    if (items.some((i) => i.day_number > trip.days)) throw httpError(400, 'Day is outside the trip dates');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const it of items) {
        await conn.query('UPDATE itinerary_items SET day_number = ?, position = ? WHERE id = ? AND trip_id = ?', [it.day_number, it.position, it.id, trip.id]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    res.json({ message: 'Order saved' });
  })
);

router.put('/trips/:id/items/:itemId', authenticate, idParam, param('itemId').isInt({ min: 1 }), itemRules, validate, asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.user.id, req.params.id);
  const itemId = Number(req.params.itemId);
  const b = req.body;
  const [exists] = await pool.query('SELECT id FROM itinerary_items WHERE id = ? AND trip_id = ?', [itemId, trip.id]);
  if (!exists.length) throw httpError(404, 'Itinerary item not found');
  if (b.day_number > trip.days) throw httpError(400, `Day must be between 1 and ${trip.days}`);

  const time = normalizeTime(b.start_time);
  const conflict = await findConflict(trip.id, b.day_number, time, b.title, b.destination_id, itemId);
  if (conflict) throw httpError(409, conflict);

  await pool.query(
    `UPDATE itinerary_items SET destination_id = ?, attraction_id = ?, day_number = ?, title = ?, activity_type = ?,
            start_time = ?, est_cost = ?, notes = ? WHERE id = ? AND trip_id = ?`,
    [b.destination_id, b.attraction_id || null, b.day_number, b.title, b.activity_type, time, b.est_cost || 0, b.notes || null, itemId, trip.id]
  );
  res.json({ message: 'Item updated' });
}));

router.delete('/trips/:id/items/:itemId', authenticate, idParam, param('itemId').isInt({ min: 1 }), validate, asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.user.id, req.params.id);
  await pool.query('DELETE FROM itinerary_items WHERE id = ? AND trip_id = ?', [req.params.itemId, trip.id]);
  res.json({ message: 'Item deleted' });
}));

module.exports = router;