import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api, { errMsg } from '../api'
import ItineraryBuilder from '../components/ItineraryBuilder'
import TripForm from '../components/TripForm'
import { ErrorBox, PageHeader, Spinner } from '../components/ui'
import { fmtDate, fmtMoney } from '../lib/format'
import { loadWidgets } from '../lib/widgets'

export const route = { path: '/trips/:id', access: 'auth' }

const widgets = loadWidgets(import.meta.glob('../components/trip-widgets/*.jsx', { eager: true }))

export default function TripDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/trips/${id}`)
      setData(data)
    } catch (err) {
      setError(errMsg(err))
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (error) return <div className="space-y-4"><ErrorBox>{error}</ErrorBox><Link to="/dashboard" className="btn-secondary">Back</Link></div>
  if (!data) return <Spinner />

  const { trip, items } = data

  const saveDetails = async (values) => {
    await api.put(`/trips/${trip.id}`, values)
    setEditing(false)
    load()
  }

  const remove = async () => {
    if (!window.confirm('Delete this trip and its itinerary?')) return
    try {
      await api.delete(`/trips/${trip.id}`)
      navigate('/dashboard')
    } catch (err) {
      setError(errMsg(err))
    }
  }

  const planned = items.reduce((s, i) => s + i.est_cost, 0)

  return (
    <div className="space-y-6">
      <PageHeader title={trip.title} subtitle={`${fmtDate(trip.start_date)} → ${fmtDate(trip.end_date)} · ${trip.days} days · ${trip.travelers} traveler(s)`}>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setEditing(!editing)}>{editing ? 'Close' : 'Edit trip'}</button>
          <button className="btn-danger" onClick={remove}>Delete</button>
        </div>
      </PageHeader>

      {editing && (
        <TripForm
          initial={{ title: trip.title, start_date: trip.start_date, end_date: trip.end_date, travelers: trip.travelers, total_budget: trip.total_budget }}
          submitLabel="Save changes"
          onSubmit={saveDetails}
          onCancel={() => setEditing(false)}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-slate-500">Total budget</p><p className="text-2xl font-bold">{fmtMoney(trip.total_budget)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Planned activity costs</p><p className="text-2xl font-bold">{fmtMoney(planned)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Activities planned</p><p className="text-2xl font-bold">{items.length}</p></div>
      </div>

      {widgets.map(({ Component }, i) => <Component key={i} trip={trip} items={items} reload={load} />)}

      <ItineraryBuilder trip={trip} items={items} reload={load} defaultDestination={searchParams.get('destination')} />
    </div>
  )
}