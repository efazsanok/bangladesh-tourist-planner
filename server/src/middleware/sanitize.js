function clean(value) {
    if (typeof value === 'string') return value.replace(/\0/g, '').replace(/<[^>]*>/g, '').trim();
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') {
        for (const key of Object.keys(value)) {
            if (key === 'password') continue;
            value[key] = clean(value[key]);
        }
    }
    return value;
}
module.exports = (req, res, next) => {
    if (req.body) req.body = clean(req.body);
    next();
};