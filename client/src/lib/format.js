export const fmtMoney = (n) => `৳${Number(n || 0).toLocaleString('en-US')}`
export const fmtDate = (s) =>
 new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short',
year: 'numeric' })
export const addDaysStr = (s, n) => {
 const d = new Date(`${s}T00:00:00`)
 d.setDate(d.getDate() + n)
 const pad = (x) => String(x).padStart(2, '0')
 return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export const todayStr = () => addDaysStr(new Date().toISOString().slice(0, 10), 0)
export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ') : '')