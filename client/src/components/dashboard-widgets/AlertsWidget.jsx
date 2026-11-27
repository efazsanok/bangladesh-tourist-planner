import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { fmtDate } from '../../lib/format'
import { Notice } from '../ui'

export const order = 1

export default function AlertsWidget() {
  const [alerts, setAlerts] = useState(null)

  useEffect(() => {
    api.get('/alerts').then((r) => setAlerts(r.data.alerts)).catch(() => setAlerts([]))
  }, [])

  if (!alerts) return null
  if (!alerts.length) return <Notice tone="good">✅ No severe weather alerts for your upcoming trips.</Notice>

  return (
    <section className="space-y-2" aria-label="Weather alerts">
      <h2 className="text-lg font-semibold">⚠️ Weather alerts</h2>
      {alerts.map((a, i) => (
        <Notice key={i} tone={a.severity === 'danger' ? 'bad' : 'warn'}>
          <strong>{fmtDate(a.date)}</strong> · {a.destination} - {a.message}.{' '}
          <Link className="font-medium underline" to={`/trips/${a.tripId}`}>{a.tripTitle}</Link>
        </Notice>
      ))}
    </section>
  )
}