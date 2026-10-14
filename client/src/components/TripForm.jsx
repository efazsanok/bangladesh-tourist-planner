import { useState } from 'react'
import { ErrorBox } from './ui'
import { errMsg } from '../api'

export default function TripForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.title.trim().length < 3) return setError('Title must be at least 3 characters')
    if (!form.start_date || !form.end_date) return setError('Choose start and end dates')
    if (form.end_date < form.start_date) return setError('End date must be on or after the start date')
    const days = (new Date(form.end_date) - new Date(form.start_date)) / 86400000 + 1
    if (days > 30) return setError('A trip can be at most 30 days long')
    if (Number(form.travelers) < 1) return setError('At least 1 traveler is required')
    if (Number(form.total_budget) < 0 || form.total_budget === '') return setError('Enter a budget (0 or more)')
    setBusy(true)
    try {
      await onSubmit({ ...form, travelers: Number(form.travelers), total_budget: Number(form.total_budget) })
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4" noValidate>
      <ErrorBox>{error}</ErrorBox>
      <div>
        <label className="label" htmlFor="title">Trip title</label>
        <input id="title" name="title" className="input" placeholder="e.g. Cox's Bazar winter break" value={form.title} onChange={change} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="start_date">Start date</label>
          <input id="start_date" name="start_date" type="date" className="input" value={form.start_date} onChange={change} />
        </div>
        <div>
          <label className="label" htmlFor="end_date">End date</label>
          <input id="end_date" name="end_date" type="date" min={form.start_date} className="input" value={form.end_date} onChange={change} />
        </div>
        <div>
          <label className="label" htmlFor="travelers">Number of travelers</label>
          <input id="travelers" name="travelers" type="number" min="1" max="50" className="input" value={form.travelers} onChange={change} />
        </div>
        <div>
          <label className="label" htmlFor="total_budget">Total budget (৳)</label>
          <input id="total_budget" name="total_budget" type="number" min="0" className="input" value={form.total_budget} onChange={change} />
        </div>
      </div>
      <div className="flex gap-3">
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}