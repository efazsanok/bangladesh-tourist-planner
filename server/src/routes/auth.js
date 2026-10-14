const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
const STYLES = ['beach', 'hill', 'heritage', 'nature'];
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const publicUser = (u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    home_city: u.home_city, travel_style: u.travel_style,
    budget_min: u.budget_min, budget_max: u.budget_max,
});
const signToken = (u) =>
    jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN ||
            '7d'
    });
router.post(
    '/auth/register',
    [
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('email').trim().isEmail().withMessage('Enter a valid email').isLength({ max: 150 }),
        body('password').matches(PASSWORD_RE).withMessage('Password must be 8-72 characters and include a letter and a number'),
    ],
    validate,
    asyncHandler(async (req, res) => {
        const { name, password } = req.body;
        const email = req.body.email.toLowerCase();
        const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (exists.length) return res.status(409).json({
            message: 'An account with this email already exists'
        });
        const hash = await bcrypt.hash(password, 10); // passwords are always hashed
        const [result] = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, hash, 'tourist']);
        const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        res.status(201).json({ token: signToken(user), user: publicUser(user) });
    })
);
router.post(
    '/auth/login',
    [body('email').trim().isEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')],
    validate,
    asyncHandler(async (req, res) => {
        const email = req.body.email.toLowerCase();
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        const ok = user && (await bcrypt.compare(req.body.password, user.password_hash));
        if (!ok) return res.status(401).json({ message: 'Invalid email or password' });
        res.json({ token: signToken(user), user: publicUser(user) });
    })
);
// JWTs are stateless: logging out = the client deleting its token.
router.post('/auth/logout', (req, res) => res.json({ message: 'Logged out' }));
router.get(
    '/auth/me',
    authenticate,
    asyncHandler(async (req, res) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!rows.length) return res.status(401).json({ message: 'Account no longer exists' });
        res.json({ user: publicUser(rows[0]) });
    })
);
router.put(
    '/auth/profile',
    authenticate,
    [
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('home_city').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Home city is too long'),
        body('travel_style').optional({ values: 'falsy' }).isIn(STYLES).withMessage('Invalid travel style'),
        body('budget_min').optional({ values: 'null' }).isInt({ min: 0, max: 100000000 }).withMessage('Minimum budget must be a positive number'),
        body('budget_max').optional({ values: 'null' }).isInt({ min: 0, max: 100000000 }).withMessage('Maximum budget must be a positive number'),
        body('budget_max').custom((max, { req }) => {
            const min = req.body.budget_min;
            if (max != null && min != null && Number(max) < Number(min)) throw new Error('Maximum budget must be at least the minimum');
            return true;
        }),
    ],
    validate,
    asyncHandler(async (req, res) => {
        const b = req.body;
        await pool.query(
            'UPDATE users SET name = ?, home_city = ?, travel_style = ?, budget_min = ?, budget_max = ? WHERE id =? ',
            [b.name, b.home_city || null, b.travel_style || null, b.budget_min ?? null, b.budget_max ?? null, req.user.id]
        );
        const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        res.json({ user: publicUser(user) });
    })
);
module.exports = router;