import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import api, { errMsg } from '../api'
import { ErrorBox, PageHeader } from '../components/ui'
import { cap, fmtMoney } from '../lib/format'

export const route = { path: '/budget', access: 'public', nav: 'Budget', navOrder: 30 }

const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#94a3b8']

export default function BudgetEstimator() {
  const [destinations, setDestinations] = useState([])
  const [options, setOptions] = useState({ transport: [], hotels: [] })
  const [form, setForm] = useState({ destination_id: '', travelers: 2, days: 3, transport_mode: '', hotel_category: 'standard', activity_level: 'standard' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get('/destinations', { params: { limit: 100 } }).then((r) => {
      setDestinations(r.data.data)
      if (r.data.data[0]) setForm((f) => ({ ...f, destination_id: String(r.data.data[0].id) }))
    })
  }, [])

  useEffect(() => {
    if (!form.destination_id) return
    api.get(`/destinations/${form.destination_id}`).then((r) => {
      const transport = r.data.transport.map((t) => t.mode)
      const hotels = [...new Set(r.data.hotels.map((h) => h.category))]
      setOptions({ transport, hotels })
      setForm((f) => ({
        ...f,
        transport_mode: transport.includes(f.transport_mode) ? f.transport_mode : transport[0] || '',
        hotel_category: hotels.includes(f.hotel_category) ? f.hotel_category : hotels[0] || '',
      }))
      setResult(null)
    })
  }, [form.destination_id])

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await api.post('/budget/estimate', {
        ...form, destination_id: Number(form.destination_id), travelers: Number(form.travelers), days: Number(form.days),
      })
      setResult(data)
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Trip budget estimator" subtitle="Get an itemised cost estimate in Bangladeshi Taka." />
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="card space-y-4 lg:col-span-2">
          <ErrorBox>{error}</ErrorBox>
          <div>
            <label className="label" htmlFor="destination_id">Destination</label>
            <select id="destination_id" name="destination_id" className="input" value={form.destination_id} onChange={change}>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="travelers">Travelers</label>
              <input id="travelers" name="travelers" type="number" min="1" max="50" className="input" value={form.travelers} onChange={change} />
            </div>
            <div>
              <label className="label" htmlFor="days">Days</label>
              <input id="days" name="days" type="number" min="1" max="30" className="input" value={form.days} onChange={change} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="transport_mode">Transport mode (from Dhaka)</label>
            <select id="transport_mode" name="transport_mode" className="input" value={form.transport_mode} onChange={change}>
              {options.transport.map((m) => <option key={m} value={m}>{cap(m)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="hotel_category">Accommodation</label>
            <select id="hotel_category" name="hotel_category" className="input" value={form.hotel_category} onChange={change}>
              {options.hotels.map((h) => <option key={h} value={h}>{cap(h)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="activity_level">Activities</label>
            <select id="activity_level" name="activity_level" className="input" value={form.activity_level} onChange={change}>
              <option value="none">None</option><option value="standard">Standard</option><option value="premium">Premium</option>
            </select>
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Calculating...' : 'Estimate cost'}</button>
        </form>

        <div className="lg:col-span-3">
          {!result ? (
            <div className="card text-center text-slate-500">Fill in the form to see your estimate.</div>
          ) : (
            <div className="card space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Estimated total for {result.destination.name}</p>
                  <p className="text-4xl font-bold text-emerald-700">{fmtMoney(result.total)}</p>
                  <p className="text-sm text-slate-600">{fmtMoney(result.perPerson)} per person · {fmtMoney(result.perDay)} per day</p>
                </div>
                <Link className="btn-primary" to={`/trips/new?budget=${result.total}&travelers=${form.travelers}&destination=${result.destination.id}`}>Plan a trip with this budget</Link>
              </div>
              <div className="h-64" role="img" aria-label="Cost breakdown chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={result.items} dataKey="amount" nameKey="label" outerRadius={90} label={false}>
                      {result.items.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtMoney(v)} /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500"><tr><th className="py-1">Category</th><th>Details</th><th className="text-right">Amount</th></tr></thead>
                  <tbody>
                    {result.items.map((i) => (
                      <tr key={i.category} className="border-t border-slate-100"><td className="py-2 font-medium">{i.label}</td><td className="text-slate-500">{i.detail}</td><td className="text-right">{fmtMoney(i.amount)}</td></tr>
                    ))}
                    <tr className="border-t-2 border-slate-300 font-bold"><td className="py-2">Total</td><td /><td className="text-right">{fmtMoney(result.total)}</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">Estimates use sample per-destination prices maintained by admins and assume 2 travelers share a room.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}