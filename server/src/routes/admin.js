const express = require('express');
const { param } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const adminOnly = [authenticate, requireRole('admin')];

const CATEGORIES = ['beach', 'hill', 'heritage', 'nature'];
const RESOURCES = {
  destinations: {
    table: 'destinations', order: 't.name',
    fields: {
      name: { type: 'string', max: 120, required: true },
      division: { type: 'string', max: 50, required: true },
      category: { type: 'enum', values: CATEGORIES, required: true },
      best_season: { type: 'enum', values: ['winter', 'summer', 'monsoon', 'year_round'], required: true },
      budget_level: { type: 'enum', values: ['low', 'medium', 'high'], required: true },
      description: { type: 'string', max: 5000 },
      image_url: { type: 'string', max: 500 },
      gallery_urls: { type: 'string', max: 2000 },
      latitude: { type: 'float', min: -90, max: 90, required: true },
      longitude: { type: 'float', min: -180, max: 180, required: true },
      travel_tips: { type: 'string', max: 3000 },
      food_per_day: { type: 'int', min: 0, max: 100000, required: true },
      local_transport_per_day: { type: 'int', min: 0, max: 100000, required: true },
      activities_per_day: { type: 'int', min: 0, max: 100000, required: true },
    },
  },
  hotels: {
    table: 'hotels', order: 't.destination_id, t.price_per_night',
    fields: {
      destination_id: { type: 'int', min: 1, required: true },
      name: { type: 'string', max: 150, required: true },
      category: { type: 'enum', values: ['budget', 'standard', 'luxury'], required: true },
      price_per_night: { type: 'int', min: 0, max: 1000000, required: true },
    },
  },
  transport: {
    table: 'transport_costs', order: 't.destination_id, t.mode',
    fields: {
      destination_id: { type: 'int', min: 1, required: true },
      mode: { type: 'enum', values: ['bus', 'train', 'air', 'launch'], required: true },
      cost_per_person: { type: 'int', min: 0, max: 1000000, required: true },
    },
  },
  climate: {
    table: 'climate_monthly', order: 't.destination_id, t.month',
    fields: {
      destination_id: { type: 'int', min: 1, required: true },
      month: { type: 'int', min: 1, max: 12, required: true },
      avg_temp_c: { type: 'float', min: -10, max: 60, required: true },
      avg_rainfall_mm: { type: 'float', min: 0, max: 5000, required: true },
      avg_humidity: { type: 'float', min: 0, max: 100, required: true },
    },
  },
  attractions: {
    table: 'attractions', order: 't.destination_id, t.name',
    fields: {
      destination_id: { type: 'int', min: 1, required: true },
      name: { type: 'string', max: 150, required: true },
      description: { type: 'string', max: 500 },
      is_outdoor: { type: 'int', min: 0, max: 1, default: 1 },
      est_cost: { type: 'int', min: 0, max: 1000000, default: 0 },
    },
  },
};

function buildData(spec, body) {
  const data = {};
  for (const [name, f] of Object.entries(spec.fields)) {
    let v = body[name];
    if (v === undefined || v === null || v === '') {
      if (f.required) throw httpError(400, `${name} is required`);
      data[name] = f.default ?? null;
      continue;
    }
    if (f.type === 'int') {
      v = Number(v);
      if (!Number.isInteger(v) || v < (f.min ?? 0) || v > (f.max ?? 100000000)) throw httpError(400, `${name} must be a whole number between ${f.min ?? 0} and ${f.max ?? 100000000}`);
    } else if (f.type === 'float') {
      v = Number(v);
      if (!Number.isFinite(v) || v < f.min || v > f.max) throw httpError(400, `${name} must be a number between ${f.min} and ${f.max}`);
    } else if (f.type === 'enum') {
      if (!f.values.includes(v)) throw httpError(400, `${name} must be one of: ${f.values.join(', ')}`);
    } else {
      v = String(v);
      if (v.length > (f.max || 255)) throw httpError(400, `${name} is too long (max ${f.max || 255} characters)`);
    }
    data[name] = v;
  }
  return data;
}

const dbError = (err) => {
  if (err.code === 'ER_DUP_ENTRY') return httpError(409, 'A record with the same unique values already exists');
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return httpError(400, 'Selected destination does not exist');
  if (err.code === 'ER_ROW_IS_REFERENCED_2') return httpError(409, 'This record is used by existing trips and cannot be deleted');
  return err;
};

router.get('/admin/stats', adminOnly, asyncHandler(async (req, res) => {
  const [[users]] = await pool.query('SELECT COUNT(*) AS c FROM users');
  const [[trips]] = await pool.query('SELECT COUNT(*) AS c FROM trips');
  const [[dests]] = await pool.query('SELECT COUNT(*) AS c FROM destinations');
  const [mostPlanned] = await pool.query(
    `SELECT d.id, d.name, COUNT(DISTINCT i.trip_id) AS trips
       FROM itinerary_items i JOIN destinations d ON d.id = i.destination_id
      GROUP BY d.id, d.name ORDER BY trips DESC, d.name LIMIT 5`
  );
  res.json({ totalUsers: users.c, totalTrips: trips.c, totalDestinations: dests.c, mostPlanned });
}));

// ---- User management ----
router.get('/admin/users', adminOnly, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM trips t WHERE t.user_id = u.id) AS trips
       FROM users u ORDER BY u.created_at DESC`
  );
  res.json({ data: rows });
}));

router.put('/admin/users/:id/role', adminOnly, param('id').isInt({ min: 1 }), validate, asyncHandler(async (req, res) => {
  const role = req.body.role;
  if (!['tourist', 'admin'].includes(role)) throw httpError(400, 'Role must be tourist or admin');
  if (Number(req.params.id) === req.user.id) throw httpError(400, 'You cannot change your own role');
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ message: 'Role updated' });
}));

router.delete('/admin/users/:id', adminOnly, param('id').isInt({ min: 1 }), validate, asyncHandler(async (req, res) => {
  if (Number(req.params.id) === req.user.id) throw httpError(400, 'You cannot delete your own account');
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message: 'User deleted' });
}));

const getSpec = (req) => {
  const spec = RESOURCES[req.params.resource];
  if (!spec) throw httpError(404, 'Unknown resource');
  return spec;
};

router.get('/admin/:resource', adminOnly, asyncHandler(async (req, res) => {
  const spec = getSpec(req);
  const hasDest = 'destination_id' in spec.fields;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = 20;
  const where = [];
  const params = [];
  if (hasDest && req.query.destination_id) { where.push('t.destination_id = ?'); params.push(Number(req.query.destination_id)); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const join = hasDest ? 'JOIN destinations d ON d.id = t.destination_id' : '';
  const select = hasDest ? 't.*, d.name AS destination_name' : 't.*';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ?? t ${join} ${clause}`, [spec.table, ...params]);
  const [rows] = await pool.query(
    `SELECT ${select} FROM ?? t ${join} ${clause} ORDER BY ${spec.order} LIMIT ? OFFSET ?`,
    [spec.table, ...params, limit, (page - 1) * limit]
  );
  res.json({ data: rows, page, limit, total });
}));

router.post('/admin/:resource', adminOnly, asyncHandler(async (req, res) => {
  const spec = getSpec(req);
  const data = buildData(spec, req.body);
  try {
    const [r] = await pool.query('INSERT INTO ?? SET ?', [spec.table, data]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { throw dbError(err); }
}));

router.put('/admin/:resource/:id', adminOnly, param('id').isInt({ min: 1 }), validate, asyncHandler(async (req, res) => {
  const spec = getSpec(req);
  const data = buildData(spec, req.body);
  try {
    const [r] = await pool.query('UPDATE ?? SET ? WHERE id = ?', [spec.table, data, req.params.id]);
    if (!r.affectedRows) throw httpError(404, 'Record not found');
    res.json({ message: 'Updated' });
  } catch (err) { throw dbError(err); }
}));

router.delete('/admin/:resource/:id', adminOnly, param('id').isInt({ min: 1 }), validate, asyncHandler(async (req, res) => {
  const spec = getSpec(req);
  try {
    await pool.query('DELETE FROM ?? WHERE id = ?', [spec.table, req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { throw dbError(err); }
}));

module.exports = router;