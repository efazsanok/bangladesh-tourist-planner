require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const sanitize = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'img-src': ["'self'", 'data:', 'https:'],
            'frame-src': ["'self'", 'https://www.openstreetmap.org'],
            'upgrade-insecure-requests': null,
        },
    },
}));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(sanitize);
app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders:
        false
}));
app.use('/api/auth', rateLimit({
    windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders:
        false
}));
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const routesDir = path.join(__dirname, 'routes');
fs.readdirSync(routesDir)
    .filter((file) => file.endsWith('.js'))
    .sort()
    .forEach((file) => app.use('/api', require(path.join(routesDir, file))));
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api).*/, (req, res) =>
        res.sendFile(path.join(clientDist, 'index.html')));
}
app.use(notFound);
app.use(errorHandler);
module.exports = app;