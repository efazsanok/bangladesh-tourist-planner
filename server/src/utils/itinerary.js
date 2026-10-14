
const pool = require('../config/db');
const httpError = require('./httpError');
const { daysInclusive } = require('./dates');
// Loads a trip that belongs to the user (404 otherwise) and adds trip.days.
async function getOwnedTrip(userId, tripId) {
 const [rows] = await pool.query('SELECT * FROM trips WHERE id = ? AND user_id = ?', [tripId, userId]);
 if (!rows.length) throw httpError(404, 'Trip not found');
 const trip = rows[0];
 trip.days = daysInclusive(trip.start_date, trip.end_date);
 return trip;
}
async function getTripItems(tripId) {
 const [items] = await pool.query(
 `SELECT i.*, d.name AS destination_name
 FROM itinerary_items i JOIN destinations d ON d.id = i.destination_id
 WHERE i.trip_id = ? ORDER BY i.day_number, i.position, i.id`,
 [tripId]
 );
 return items;
}
const normalizeTime = (t) => (t ? (t.length === 5 ? `${t}:00` : t) : null);
async function findConflict(tripId, day, startTime, title, destinationId, excludeId = 0) {
 if (startTime) {
 const [same] = await pool.query(
 'SELECT id FROM itinerary_items WHERE trip_id = ? AND day_number = ? AND start_time = ? AND id <> ?
LIMIT 1',
 [tripId, day, startTime, excludeId]
 );
 if (same.length) return 'Another activity is already scheduled at that time on this day';
 }
 const [dup] = await pool.query(
 'SELECT id FROM itinerary_items WHERE trip_id = ? AND day_number = ? AND destination_id = ? AND title =
? AND id <> ? LIMIT 1',
 [tripId, day, destinationId, title, excludeId]
 );
 if (dup.length) return 'This activity is already in the itinerary for that day';
 return null;
}
module.exports = { getOwnedTrip, getTripItems, normalizeTime, findConflict };