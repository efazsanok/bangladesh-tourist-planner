import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { errMsg } from '../api'
import MapEmbed from '../components/MapEmbed'
import { Badge, ErrorBox, Spinner } from '../components/ui'
import { cap, fmtMoney } from '../lib/format'
import { loadWidgets } from '../lib/widgets'

export const route = { path: '/destinations/:id', access: 'public' }

// Weather, best-time chart, wishlist button etc. plug in from components/destination-widgets
const widgets = loadWidgets(import.meta.glob('../components/destination-widgets/*.jsx', { eager: true }))

export default function DestinationDetails() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    api.get(`/destinations/${id}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)))
  }, [id])

  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!data) return <Spinner />
  const { destination: d, attractions, hotels, transport } = data

  return (
    <div className="space-y-8">
      <Link to="/destinations" className="text-sm text-emerald-700 hover:underline">← All destinations</Link>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <img src={d.image_url} alt={d.name} className="h-72 w-full rounded-xl bg-slate-200 object-cover sm:h-96" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
          {d.gallery.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {d.gallery.map((g) => <img key={g} src={g} alt={`${d.name} gallery`} loading="lazy" className="h-32 w-full rounded-lg bg-slate-200 object-cover" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />)}
            </div>
          )}
        </div>
        <div className="card h-fit">
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">{cap(d.category)}</Badge><Badge tone="blue">{d.division}</Badge>
            <Badge tone="amber">{cap(d.budget_level)} budget</Badge><Badge>Best: {cap(d.best_season)}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{d.name}</h1>
          <p className="mt-3 text-slate-600">{d.description}</p>
          <Link to={`/trips/new?destination=${d.id}`} className="btn-primary mt-5 w-full">Plan a trip here</Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">Attractions</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {attractions.map((a) => (
              <li key={a.id} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{a.name}</span>
                  <Badge tone={a.is_outdoor ? 'green' : 'blue'}>{a.is_outdoor ? 'Outdoor' : 'Indoor'}</Badge>
                </div>
                <p className="text-sm text-slate-600">{a.description} {a.est_cost > 0 && <span className="text-slate-500">· {fmtMoney(a.est_cost)}</span>}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold">Nearby hotels</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500"><tr><th className="py-1">Hotel</th><th>Category</th><th className="text-right">Per night</th></tr></thead>
                <tbody>
                  {hotels.map((h) => <tr key={h.id} className="border-t border-slate-100"><td className="py-2">{h.name}</td><td>{cap(h.category)}</td><td className="text-right">{fmtMoney(h.price_per_night)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold">Getting there (from Dhaka, per person one way)</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {transport.map((t) => <div key={t.mode} className="rounded-lg bg-slate-100 px-3 py-2 text-sm"><span className="font-medium">{cap(t.mode)}</span> · {fmtMoney(t.cost_per_person)}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">Travel tips</h2>
          <p className="mt-2 text-slate-600">{d.travel_tips || 'No tips added yet.'}</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">Location</h2>
          <MapEmbed lat={d.latitude} lng={d.longitude} name={d.name} />
        </div>
      </section>

      {widgets.map(({ Component }, i) => <Component key={i} destination={d} />)}
    </div>
  )
}
