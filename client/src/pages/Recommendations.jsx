import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errMsg } from '../api'
import { Badge, ErrorBox, Notice, PageHeader, ratingTone } from '../components/ui'
import { cap, fmtMoney } from '../lib/format'

export const route = { path: '/recommendations', access: 'public', nav: 'Recommend', navOrder: 40 }

const INTERESTS = ['beach', 'hill', 'heritage', 'nature']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function Recommendations() {
  const [form, setForm] = useState({ budget: 15000, days: 3, travelers: 2, month: new Date().getMonth() + 1, interests: [] })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const toggle = (i) => setForm({ ...form, interests: form.interests.includes(i) ? form.interests.filter((x) => x !== i) : [...form.interests, i] })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await api.post('/recommendations', {
        budget: Number(form.budget), days: Number(form.days), travelers: Number(form.travelers),
        month: Number(form.month), interests: form.interests,
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
      <PageHeader title="Find a destination for my budget" subtitle="Tell us your budget and interests - we rank destinations that fit your wallet and have good weather in your travel month." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="card h-fit space-y-4">
          <ErrorBox>{error}</ErrorBox>
          <div>
            <label className="label" htmlFor="budget">Total budget (৳)</label>
            <input id="budget" name="budget" type="number" min="500" className="input" value={form.budget} onChange={change} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="days">Days</label><input id="days" name="days" type="number" min="1" max="30" className="input" value={form.days} onChange={change} /></div>
            <div><label className="label" htmlFor="travelers">Travelers</label><input id="travelers" name="travelers" type="number" min="1" max="50" className="input" value={form.travelers} onChange={change} /></div>
          </div>
          <div>
            <label className="label" htmlFor="month">Travel month</label>
            <select id="month" name="month" className="input" value={form.month} onChange={change}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="label">Interests</legend>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button type="button" key={i} aria-pressed={form.interests.includes(i)} onClick={() => toggle(i)}
                  className={`rounded-full px-3 py-1 text-sm ${form.interests.includes(i) ? 'bg-emerald-600 text-white' : 'bg-white ring-1 ring-slate-300 hover:bg-slate-100'}`}>{cap(i)}</button>
              ))}
            </div>
          </fieldset>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Searching...' : 'Recommend destinations'}</button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          {!result && <div className="card text-center text-slate-500">Your ranked results will appear here.</div>}
          {result && result.results.length === 0 && (
            <Notice tone="warn">No destination fits that budget with good weather in {result.month}. Try a larger budget, fewer travelers or a different month.</Notice>
          )}
          {result?.results.map((r, idx) => (
            <article key={r.id} className="card flex flex-col gap-4 sm:flex-row">
              <img src={r.image_url} alt={r.name} loading="lazy" className="h-36 w-full rounded-lg bg-slate-200 object-cover sm:w-48" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-emerald-700">#{idx + 1}</span>
                  <h2 className="text-lg font-semibold"><Link to={`/destinations/${r.id}`} className="hover:text-emerald-700">{r.name}</Link></h2>
                  <Badge tone="green">{cap(r.category)}</Badge>
                  <Badge tone={ratingTone(r.weatherScore >= 70 ? 'Good' : 'Fair')}>Weather {r.weatherScore}/100</Badge>
                </div>
                <p className="mt-1 text-xl font-bold">{fmtMoney(r.estimatedCost)} <span className="text-sm font-normal text-slate-500">estimated</span></p>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-600">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
                <Link to={`/trips/new?destination=${r.id}&budget=${r.estimatedCost}&travelers=${form.travelers}`} className="btn-secondary mt-3">Plan this trip</Link>
              </div>
            </article>
          ))}
          {result && (result.excluded.overBudget > 0 || result.excluded.poorWeather > 0) && (
            <p className="text-sm text-slate-500">Left out: {result.excluded.overBudget} over budget, {result.excluded.poorWeather} with poor weather in {result.month}.</p>
          )}
        </div>
      </div>
    </div>
  )
}
