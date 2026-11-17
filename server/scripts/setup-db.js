// Creates the schema and loads sample data:  npm run db:setup
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { PROFILES, HUMIDITY, destinations } = require('./seedData');
async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Creating database and tables...');
  await conn.query(fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8'));
  await conn.query('USE tourist_planner');

  console.log('Creating demo users...');
  const users = [
    ['Admin User', 'admin@tourist.com', 'Admin@123', 'admin'],
    ['Demo Tourist', 'tourist@example.com', 'Tourist@123', 'tourist'],
  ];
  for (const [name, email, pw, role] of users) {
    const hash = await bcrypt.hash(pw, 10);
    await conn.query(
      'INSERT INTO users (name,email,password_hash,role,home_city,travel_style,budget_min,budget_max) VALUES (?,?,?,?,?,?,?,?)',
      [name, email, hash, role, 'Dhaka', 'beach', 10000, 40000]
    );
  }

  console.log('Loading destinations, hotels, transport, attractions and climate...');
  const labels = ['Budget', 'Standard', 'Luxury'];
  const cats = ['budget', 'standard', 'luxury'];
  for (const d of destinations) {
    const [r] = await conn.query('INSERT INTO destinations SET ?', [d.row]);
    const id = r.insertId;

    for (const [mode, cost] of Object.entries(d.transport)) {
      await conn.query('INSERT INTO transport_costs (destination_id,mode,cost_per_person) VALUES (?,?,?)', [id, mode, cost]);
    }
    for (let i = 0; i < 3; i++) {
      const price = d.hotels[i];
      await conn.query('INSERT INTO hotels (destination_id,name,category,price_per_night) VALUES ?', [[
        [id, `${d.short} ${labels[i]} Stay A`, cats[i], Math.round(price * 0.9)],
        [id, `${d.short} ${labels[i]} Stay B`, cats[i], Math.round(price * 1.1)],
      ]]);
    }
    await conn.query(
      'INSERT INTO attractions (destination_id,name,description,is_outdoor,est_cost) VALUES ?',
      [d.attractions.map((a) => [id, ...a])]
    );
    const p = PROFILES[d.climate];
    const rows = p.temp.map((t, m) => [id, m + 1, t, p.rain[m], HUMIDITY[m]]);
    await conn.query('INSERT INTO climate_monthly (destination_id,month,avg_temp_c,avg_rainfall_mm,avg_humidity) VALUES ?', [rows]);
  }

  await conn.end();
  console.log('\nDone! Demo logins:');
  console.log('  Admin  : admin@tourist.com   / Admin@123');
  console.log('  Tourist: tourist@example.com / Tourist@123');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
