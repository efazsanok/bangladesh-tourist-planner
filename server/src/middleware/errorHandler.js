function notFound(req, res) {
    res.status(404).json({ message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
}
module.exports = { notFound, errorHandler };
