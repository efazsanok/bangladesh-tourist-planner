const pool = require('../config/db');
const { addDays } = require('./dates');
const { fetchForecast } = require('./weatherClient');

const LEVELS = ['Good', 'Caution', 'Avoid'];

function rateDay(w) {
  const rainMm = w.rainMm ?? 0, rainChance = w.rainChance ?? 0, wind = w.wind ?? 0, tempMax = w.tempMax ?? 28;
  let level = 0;
  const reasons = [];
  const raise = (l, msg) => { level = Math.max(level, l); reasons.push(msg); };

  if (rainMm >= 50 || (rainChance >= 80 && rainMm >= 25)) raise(2, 'Very heavy rain expected');
  else if (rainChance >= 50 || rainMm >= 10) raise(1, 'Rain is likely');
  if (wind >= 60) raise(2, 'Storm-force winds');
  else if (wind >= 35) raise(1, 'Strong winds');
  if (tempMax >= 40) raise(2, 'Dangerous heat');
  else if (tempMax >= 36) raise(1, 'Very hot');
  else if (tempMax <= 8) raise(1, 'Very cold');

  return { rating: LEVELS[level], reasons: reasons.length ? reasons : ['Conditions look fine'] };
}

function alertsForDay(w) {
  const out = [];
  if ((w.rainMm ?? 0) >= 30 || (w.rainChance ?? 0) >= 80) {
    out.push({ type: 'heavy_rain', severity: 'warning', message: `Heavy rain forecast (${w.rainMm} mm, ${w.rainChance}% chance)` });
  }
  if ((w.wind ?? 0) >= 50) out.push({ type: 'storm', severity: 'danger', message: `Storm-level winds forecast (${w.wind} km/h)` });
  if ((w.tempMax ?? 0) >= 38) out.push({ type: 'extreme_heat', severity: 'warning', message: `Extreme heat forecast (${w.tempMax} °C)` });
  return out;
}

async function climateEstimate(destinationId, date) {
  const month = Number(date.slice(5, 7));
  const [rows] = await pool.query('SELECT * FROM climate_monthly WHERE destination_id = ? AND month = ?', [destinationId, month]);
  if (!rows.length) return { tempMax: 30, rainChance: 20, rainMm: 2, wind: 10 };
  const c = rows[0];
  return {
    tempMax: Math.round(c.avg_temp_c + 3),
    rainChance: Math.min(95, Math.round(c.avg_rainfall_mm / 6)),
    rainMm: Math.round(c.avg_rainfall_mm / 30),
    wind: 10,
  };
}

async function rateTripDays(trip, items) {
  if (!items.length) return [];
  const counts = {};
  items.forEach((i) => { counts[i.destination_id] = (counts[i.destination_id] || 0) + 1; });
  const primary = Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]);

  const destIds = Object.keys(counts).map(Number);
  const [dests] = await pool.query('SELECT id, name, latitude, longitude FROM destinations WHERE id IN (?)', [destIds]);
  const destMap = Object.fromEntries(dests.map((d) => [d.id, d]));
  const forecasts = {};
  await Promise.all(dests.map(async (d) => {
    try { forecasts[d.id] = await fetchForecast(d.latitude, d.longitude); } catch (e) { forecasts[d.id] = null; }
  }));

  const days = [];
  for (let day = 1; day <= trip.days; day++) {
    const date = addDays(trip.start_date, day - 1);
    const firstItem = items.find((i) => i.day_number === day);
    const destId = firstItem ? firstItem.destination_id : primary;
    const live = forecasts[destId]?.daily.find((x) => x.date === date);
    const weather = live || (await climateEstimate(destId, date));
    const { rating, reasons } = rateDay(weather);
    days.push({
      day, date, destinationId: destId, destinationName: destMap[destId].name,
      rating, reasons, source: live ? 'forecast' : 'climate',
      weather: { tempMax: weather.tempMax, rainChance: weather.rainChance, rainMm: weather.rainMm, wind: weather.wind },
    });
  }
  return days;
}

module.exports = { rateDay, alertsForDay, rateTripDays };