import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api, { errMsg } from '../api'
import { ErrorBox, Notice, Spinner } from './ui'

const dayName = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })

export default function WeatherPanel({ destinationId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    setError('')
    api.get(`/destinations/${destinationId}/weather`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)))
  }, [destinationId])

  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!data) return <Spinner label="Fetching weather..." />
  const c = data.current
  const chart = data.daily.map((d) => ({ name: dayName(d.date), max: d.tempMax, min: d.tempMin, rain: d.rainChance }))

  return (
    <div className="space-y-5">
      {data.stale && <Notice tone="warn">Live weather is temporarily unavailable - showing the last saved forecast.</Notice>}
      <div className="card flex flex-wrap items-center gap-6">
        <div className="text-6xl" aria-hidden="true">{c.icon}</div>
        <div>
          <p className="text-sm text-slate-500">Right now in {data.destination.name}</p>
          <p className="text-4xl font-bold">{Math.round(c.temperature)}°C</p>
          <p className="text-slate-600">{c.description}</p>
        </div>
        <dl className="grid grid-cols-3 gap-6 text-sm">
          <div><dt className="text-slate-500">Humidity</dt><dd className="font-semibold">{c.humidity}%</dd></div>
          <div><dt className="text-slate-500">Wind</dt><dd className="font-semibold">{c.wind} km/h</dd></div>
          <div><dt className="text-slate-500">Rain now</dt><dd className="font-semibold">{c.rainfall} mm</dd></div>
        </dl>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {data.daily.map((d) => (
          <div key={d.date} className="card p-3 text-center">
            <p className="text-xs font-medium text-slate-500">{dayName(d.date)}</p>
            <p className="my-1 text-3xl" title={d.description}>{d.icon}</p>
            <p className="text-sm font-semibold">{Math.round(d.tempMax)}° <span className="font-normal text-slate-500">{Math.round(d.tempMin)}°</span></p>
            <p className="text-xs text-sky-700">☔ {d.rainChance}%</p>
            <p className="text-xs text-slate-500">💧 {d.humidity != null ? `${Math.round(d.humidity)}%` : '-'} · 🌬 {Math.round(d.wind)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 font-semibold">Temperature (°C)</h3>
          <div className="h-60" role="img" aria-label="Temperature forecast chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                <Line type="monotone" dataKey="max" name="High" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="min" name="Low" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold">Chance of rain (%)</h3>
          <div className="h-60" role="img" aria-label="Rain chance chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip />
                <Bar dataKey="rain" name="Rain chance" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
