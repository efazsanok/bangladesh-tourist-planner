const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
        return res.status(400).json({ message: errors[0].message, errors });
    }
    next();
};