import { useEffect, useState } from 'react'
import api, { errMsg } from '../api'
import { Badge, ErrorBox } from './ui'
import { addDaysStr, fmtDate, fmtMoney } from '../lib/format'

function ItemForm({ trip, destinations, item, day, onClose, onSaved }) {
  const [form, setForm] = useState({
    destination_id: item?.destination_id || trip.defaultDestination || '',
    attraction_id: item?.attraction_id || '',
    title: item?.title || '',
    day_number: item?.day_number || day || 1,
    activity_type: item?.activity_type || 'outdoor',
    start_time: item?.start_time ? item.start_time.slice(0, 5) : '',
    est_cost: item?.est_cost ?? 0,
    notes: item?.notes || '',
  })
  const [attractions, setAttractions] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!form.destination_id) { setAttractions([]); return }
    api.get(`/destinations/${form.destination_id}`).then((r) => setAttractions(r.data.attractions)).catch(() => setAttractions([]))
  }, [form.destination_id])

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const pickAttraction = (e) => {
    const a = attractions.find((x) => String(x.id) === e.target.value)
    if (!a) return setForm({ ...form, attraction_id: '' })
    setForm({ ...form, attraction_id: a.id, title: a.name, activity_type: a.is_outdoor ? 'outdoor' : 'indoor', est_cost: a.est_cost })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.destination_id) return setError('Choose a destination')
    if (form.title.trim().length < 2) return setError('Enter an activity title')
    setBusy(true)
    const payload = {
      ...form,
      destination_id: Number(form.destination_id),
      attraction_id: form.attraction_id ? Number(form.attraction_id) : null,
      day_number: Number(form.day_number),
      est_cost: Number(form.est_cost) || 0,
      start_time: form.start_time || null,
    }
    try {
      if (item) await api.put(`/trips/${trip.id}/items/${item.id}`, payload)
      else await api.post(`/trips/${trip.id}/items`, payload)
      onSaved()
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4" noValidate>
      <h4 className="font-semibold">{item ? 'Edit activity' : 'Add activity'}</h4>
      <ErrorBox>{error}</ErrorBox>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="destination_id">Destination</label>
          <select id="destination_id" name="destination_id" className="input" value={form.destination_id} onChange={change}>
            <option value="">Select...</option>
            {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="attraction_id">Pick an attraction (optional)</label>
          <select id="attraction_id" className="input" value={form.attraction_id} onChange={pickAttraction}>
            <option value="">Custom activity</option>
            {attractions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">Activity</label>
          <input id="title" name="title" className="input" value={form.title} onChange={change} />
        </div>
        <div>
          <label className="label" htmlFor="day_number">Day</label>
          <select id="day_number" name="day_number" className="input" value={form.day_number} onChange={change}>
            {Array.from({ length: trip.days }, (_, i) => <option key={i + 1} value={i + 1}>Day {i + 1}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="activity_type">Type</label>
          <select id="activity_type" name="activity_type" className="input" value={form.activity_type} onChange={change}>
            <option value="outdoor">Outdoor</option>
            <option value="indoor">Indoor</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="start_time">Start time (optional)</label>
          <input id="start_time" name="start_time" type="time" className="input" value={form.start_time} onChange={change} />
        </div>
        <div>
          <label className="label" htmlFor="est_cost">Estimated cost (৳)</label>
          <input id="est_cost" name="est_cost" type="number" min="0" className="input" value={form.est_cost} onChange={change} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="notes">Notes</label>
          <input id="notes" name="notes" className="input" value={form.notes} onChange={change} />
        </div>
      </div>
      <div className="flex gap-3">
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : item ? 'Save changes' : 'Add to itinerary'}</button>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      </div>
    </form>
  )
}

export default function ItineraryBuilder({ trip, items, reload, defaultDestination }) {
  const [destinations, setDestinations] = useState([])
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/destinations', { params: { limit: 100 } }).then((r) => setDestinations(r.data.data)).catch(() => {})
  }, [])

  const builderTrip = { ...trip, defaultDestination: defaultDestination || items[0]?.destination_id }
  const byDay = (d) => items.filter((i) => i.day_number === d)

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    try {
      await api.delete(`/trips/${trip.id}/items/${item.id}`)
      reload()
    } catch (err) {
      setError(errMsg(err))
    }
  }

  const move = async (day, index, dir) => {
    const list = [...byDay(day)]
    const j = index + dir
    if (j < 0 || j >= list.length) return
    ;[list[index], list[j]] = [list[j], list[index]]
    try {
      await api.put(`/trips/${trip.id}/items/reorder`, {
        items: list.map((it, p) => ({ id: it.id, day_number: day, position: p + 1 })),
      })
      reload()
    } catch (err) {
      setError(errMsg(err))
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Itinerary</h2>
      <ErrorBox>{error}</ErrorBox>
      {Array.from({ length: trip.days }, (_, i) => i + 1).map((day) => {
        const list = byDay(day)
        return (
          <div key={day} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-emerald-800">
                Day {day} <span className="font-normal text-slate-500">· {fmtDate(addDaysStr(trip.start_date, day - 1))}</span>
              </h3>
              <button className="btn-secondary" onClick={() => setForm({ day })}>+ Add activity</button>
            </div>
            {list.length === 0 && !(form && !form.item && form.day === day) && (
              <p className="mt-3 text-sm text-slate-500">Nothing planned yet.</p>
            )}
            <ul className="mt-3 space-y-2">
              {list.map((item, idx) => (
                form?.item?.id === item.id ? (
                  <li key={item.id}>
                    <ItemForm trip={builderTrip} destinations={destinations} item={item} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />
                  </li>
                ) : (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="font-medium">
                        {item.start_time && <span className="mr-2 text-slate-500">{item.start_time.slice(0, 5)}</span>}
                        {item.title}
                      </p>
                      <p className="text-sm text-slate-500">{item.destination_name} · {fmtMoney(item.est_cost)} {item.notes && `· ${item.notes}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={item.activity_type === 'outdoor' ? 'green' : 'blue'}>{item.activity_type}</Badge>
                      <button className="btn-secondary px-2" aria-label="Move up" disabled={idx === 0} onClick={() => move(day, idx, -1)}>↑</button>
                      <button className="btn-secondary px-2" aria-label="Move down" disabled={idx === list.length - 1} onClick={() => move(day, idx, 1)}>↓</button>
                      <button className="btn-secondary" onClick={() => setForm({ item, day })}>Edit</button>
                      <button className="btn-danger" onClick={() => remove(item)}>Delete</button>
                    </div>
                  </li>
                )
              ))}
            </ul>
            {form && !form.item && form.day === day && (
              <div className="mt-3">
                <ItemForm trip={builderTrip} destinations={destinations} day={day} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload() }} />
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}