require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
    process.exit(1);
}
const PORT = process.env.PORT || 5000;
(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('MySQL connected');
    } catch (err) {
        console.error('MySQL connection failed (is XAMPP MySQL running?):', err.message);
    }
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
})();

