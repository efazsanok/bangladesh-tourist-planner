import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api, { errMsg } from '../../api'
import { ErrorBox, Spinner } from '../ui'

export default function StatsTab() {
  const [s, setS] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)).catch((e) => setError(errMsg(e))) }, [])

  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!s) return <Spinner />
  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Total users', s.totalUsers], ['Trips created', s.totalTrips], ['Destinations', s.totalDestinations]].map(([l, v]) => (
          <div key={l} className="card"><p className="text-sm text-slate-500">{l}</p><p className="text-3xl font-bold">{v}</p></div>
        ))}
      </div>
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Most-planned destinations</h2>
        {s.mostPlanned.length === 0 ? <p className="text-sm text-slate-500">No trips with destinations yet.</p> : (
          <div className="h-64" role="img" aria-label="Most planned destinations chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.mostPlanned}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
                <Bar dataKey="trips" name="Trips" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  )
}