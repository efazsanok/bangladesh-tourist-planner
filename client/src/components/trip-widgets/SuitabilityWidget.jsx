import { useEffect, useState } from 'react'
import api, { errMsg } from '../../api'
import { addDaysStr, fmtDate } from '../../lib/format'
import { Badge, ErrorBox, Notice, Spinner, ratingTone } from '../ui'

export const order = 20
const bg = { Good: 'border-emerald-300 bg-emerald-50', Caution: 'border-amber-300 bg-amber-50', Avoid: 'border-red-300 bg-red-50' }

export default function SuitabilityWidget({ trip, items }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    api.get(`/trips/${trip.id}/suitability`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)))
  }, [trip.id, trip.start_date, trip.end_date, items])

  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!data) return <Spinner label="Checking weather for your dates..." />
  if (!data.days.length) return <Notice>{data.message}</Notice>

  return (
    <section className="card">
      <h2 className="text-lg font-semibold">Travel suitability by day</h2>
      <p className="text-sm text-slate-500">Live forecast is used for the next 7 days; later dates use seasonal climate averages.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.days.map((d) => (
          <div key={d.day} className={`rounded-xl border p-3 ${bg[d.rating]}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Day {d.day}</p>
              <Badge tone={ratingTone(d.rating)}>{d.rating}</Badge>
            </div>
            <p className="text-xs text-slate-500">{fmtDate(addDaysStr(trip.start_date, d.day - 1))} · {d.destinationName}</p>
            <p className="mt-2 text-sm">{d.reasons.join(', ')}</p>
            <p className="mt-1 text-xs text-slate-600">{Math.round(d.weather.tempMax)}°C · rain {d.weather.rainChance}% · wind {Math.round(d.weather.wind)} km/h</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{d.source === 'forecast' ? 'Live forecast' : 'Seasonal estimate'}</p>
          </div>
        ))}
      </div>
    </section>
  )
}