const pool = require('../config/db');
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function scoreMonth(c) {
    let score = 100;
    score -= Math.min(60, Math.round(c.avg_rainfall_mm / 15));
    if (c.avg_temp_c > 30) score -= Math.round((c.avg_temp_c - 30) * 5);
    if (c.avg_temp_c < 18) score -= Math.round((18 - c.avg_temp_c) * 4);
    if (c.avg_humidity > 85) score -= 5;
    return Math.max(0, score);
}
const ratingFor = (score) => (score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor');
const shape = (c) => {
    const score = scoreMonth(c);
    return {
        month: c.month, name: MONTH_NAMES[c.month - 1],
        avgTemp: c.avg_temp_c, rainfall: c.avg_rainfall_mm, humidity: c.avg_humidity,
        score, rating: ratingFor(score),
    };
};
async function getMonthly(destinationId) {
    const [rows] = await pool.query('SELECT * FROM climate_monthly WHERE destination_id = ? ORDER BY month',
        [destinationId]);
    return rows.map(shape);
}

async function alternativesForMonth(month, excludeId, category) {
    const [rows] = await pool.query(
        `SELECT d.id, d.name, d.category, c.month, c.avg_temp_c, c.avg_rainfall_mm, c.avg_humidity
 FROM climate_monthly c JOIN destinations d ON d.id = c.destination_id
 WHERE c.month = ? AND d.id <> ?`,
        [month, excludeId]
    );
    return rows
        .map((r) => ({ id: r.id, name: r.name, category: r.category, score: scoreMonth(r) }))
        .filter((r) => r.score >= 70)
        .sort((a, b) => (b.category === category) - (a.category === category) || b.score - a.score)
        .slice(0, 3);
}
module.exports = { MONTH_NAMES, scoreMonth, ratingFor, getMonthly, alternativesForMonth };