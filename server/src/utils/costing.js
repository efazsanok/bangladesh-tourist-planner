// Member 3 - Trip Budget Estimator: cost calculation (BDT)
const pool = require('../config/db');
const httpError = require('./httpError');

const ACTIVITY_FACTOR = { none: 0, standard: 1, premium: 1.5 };

async function loadCostData(destinationId) {
  const [dests] = await pool.query(
    'SELECT id, name, category, food_per_day, local_transport_per_day, activities_per_day FROM destinations WHERE id = ?',
    [destinationId]
  );
  if (!dests.length) return null;
  const [transport] = await pool.query('SELECT mode, cost_per_person FROM transport_costs WHERE destination_id = ?', [destinationId]);
  const [hotels] = await pool.query(
    'SELECT category, ROUND(AVG(price_per_night)) AS price FROM hotels WHERE destination_id = ? GROUP BY category',
    [destinationId]
  );
  return {
    dest: dests[0],
    transport: Object.fromEntries(transport.map((t) => [t.mode, t.cost_per_person])),
    hotels: Object.fromEntries(hotels.map((h) => [h.category, Number(h.price)])),
  };
}

// opts: { travelers, days, transportMode, hotelCategory, activityLevel }
function estimate(data, opts) {
  const { travelers, days, transportMode, hotelCategory } = opts;
  const level = opts.activityLevel || 'standard';
  const fare = data.transport[transportMode];
  if (fare === undefined) throw httpError(400, `${transportMode} is not available for ${data.dest.name}`);
  const hotel = data.hotels[hotelCategory];
  if (hotel === undefined) throw httpError(400, `No ${hotelCategory} hotels are listed for ${data.dest.name}`);

  const nights = Math.max(days - 1, 0);
  const rooms = Math.ceil(travelers / 2); // 2 people share one room
  const intercity = fare * travelers * 2; // return journey
  const local = data.dest.local_transport_per_day * days;
  const items = [
    { category: 'transport', label: 'Transport', amount: intercity + local, detail: `${transportMode} x ${travelers} (return) + local transport` },
    { category: 'accommodation', label: 'Accommodation', amount: hotel * rooms * nights, detail: `${hotelCategory} hotel, ${rooms} room(s) x ${nights} night(s)` },
    { category: 'food', label: 'Food', amount: data.dest.food_per_day * travelers * days, detail: `${travelers} person(s) x ${days} day(s)` },
    { category: 'activities', label: 'Activities', amount: Math.round(data.dest.activities_per_day * travelers * days * ACTIVITY_FACTOR[level]), detail: `${level} activities` },
  ];
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  items.push({ category: 'other', label: 'Contingency (5%)', amount: Math.round(subtotal * 0.05), detail: 'Tips, souvenirs, small extras' });
  const total = items.reduce((s, i) => s + i.amount, 0);
  return { items, total, perPerson: Math.round(total / travelers), perDay: Math.round(total / days) };
}

module.exports = { ACTIVITY_FACTOR, loadCostData, estimate };