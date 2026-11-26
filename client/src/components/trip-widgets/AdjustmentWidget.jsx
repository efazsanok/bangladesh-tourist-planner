import { useEffect, useState } from 'react'
import api, { errMsg } from '../../api'
import { fmtDate } from '../../lib/format'
import { Badge, ErrorBox, ratingTone } from '../ui'

export const order = 30

// Weather-aware itinerary adjustment: accept or ignore each suggestion with one click
export default function AdjustmentWidget({ trip, items, reload }) {
  const [list, setList] = useState([])
  const [ignored, setIgnored] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/trips/${trip.id}/adjustments`)
      .then((r) => setList(r.data.adjustments))
      .catch(() => setList([]))
  }, [trip.id, trip.start_date, trip.end_date, items])

  const apply = async (adj, opt) => {
    setError('')
    setBusyId(adj.itemId)
    try {
      await api.post(`/trips/${trip.id}/adjustments/apply`, {
        item_id: adj.itemId,
        type: opt.type,
        attraction_id: opt.attractionId,
        day: opt.day,
      })
      reload()
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusyId(null)
    }
  }

  const visible = list.filter((a) => !ignored.includes(a.itemId))
  if (!visible.length) return null

  return (
    <section className="card border-amber-300 bg-amber-50/60">
      <h2 className="text-lg font-semibold">🌧️ Weather-aware suggestions</h2>
      <p className="text-sm text-slate-600">
        These outdoor activities are planned on days with poor weather.
      </p>
      <ErrorBox>{error}</ErrorBox>
      <ul className="mt-4 space-y-4">
        {visible.map((a) => (
          <li key={a.itemId} className="rounded-lg border border-amber-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{a.title}</span>
              <Badge tone={ratingTone(a.rating)}>
                Day {a.day} · {a.rating}
              </Badge>
              <span className="text-xs text-slate-500">
                {fmtDate(a.date)} · {a.reasons.join(', ')}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {a.options.map((o, i) => (
                <button
                  key={i}
                  className="btn-primary"
                  disabled={busyId === a.itemId}
                  onClick={() => apply(a, o)}
                >
                  {o.label}
                </button>
              ))}
              {a.options.length === 0 && (
                <span className="text-sm text-slate-500">
                  No alternative found - consider rescheduling manually.
                </span>
              )}
              <button
                className="btn-secondary"
                disabled={busyId === a.itemId}
                onClick={() => setIgnored([...ignored, a.itemId])}
              >
                Ignore
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
