const DAY_MS = 86400000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function parseDate(s) {
    const [y, m, d] = String(s).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}
function formatDate(dt) {
    return dt.toISOString().slice(0, 10);
}
function daysInclusive(start, end) {
    return Math.round((parseDate(end) - parseDate(start)) / DAY_MS) + 1;
}
function addDays(s, n) {
    return formatDate(new Date(parseDate(s).getTime() + n * DAY_MS));
}
function todayStr() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
}
module.exports = { DATE_RE, parseDate, formatDate, daysInclusive, addDays, todayStr };
