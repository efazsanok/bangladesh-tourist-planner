import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api'
import { Badge, ErrorBox, PageHeader, Spinner } from '../components/ui'
import { fmtDate, fmtMoney } from '../lib/format'

export const route = { path: '/my-trips', access: 'auth', nav: 'My Trips', navOrder: 50 }

const TABS = [['upcoming', 'Upcoming'], ['ongoing', 'Ongoing'], ['past', 'Past']]
const tone = { upcoming: 'blue', ongoing: 'green', past: 'slate' }

export default function MyTrips() {
    const navigate = useNavigate()
    const [trips, setTrips] = useState(null)
    const [tab, setTab] = useState('upcoming')
    const [error, setError] = useState('')

    const load = useCallback(() => {
        api.get('/trips').then((r) => setTrips(r.data.trips)).catch((e) => setError(errMsg(e)))
    }, [])
    useEffect(() => { load() }, [load])

    const duplicate = async (trip) => {
        const start = window.prompt('Start date for the new trip (YYYY-MM-DD). Leave empty to start today:', '')
        if (start === null) return
        try {
            const { data } = await api.post(`/trips/${trip.id}/duplicate`, { start_date: start || undefined })
            navigate(`/trips/${data.id}`)
        } catch (err) { setError(errMsg(err)) }
    }

    const remove = async (trip) => {
        if (!window.confirm(`Delete "${trip.title}"?`)) return
        try { await api.delete(`/trips/${trip.id}`); load() } catch (err) { setError(errMsg(err)) }
    }

    if (!trips) return error ? <ErrorBox>{error}</ErrorBox> : <Spinner />
    const list = trips.filter((t) => t.status === tab)

    return (
        <div>
            <PageHeader title="My trips" subtitle="Manage your upcoming, ongoing and past trips.">
                <Link to="/trips/new" className="btn-primary">+ New trip</Link>
            </PageHeader>
            <ErrorBox>{error}</ErrorBox>
            <div className="mb-5 flex gap-2" role="tablist">
                {TABS.map(([key, label]) => (
                    <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === key ? 'bg-emerald-600 text-white' : 'bg - white text - slate - 600 ring - 1 ring - slate - 300 hover:bg-slate-100'}`}>
                {label} ({trips.filter((t) => t.status === key).length})
            </button> 
        ))}
        </div> 
      {
        list.length === 0 ? <div className="card text-center text-slate-500">No {tab} trips.</div> : (
            <div className="grid gap-4 md:grid-cols-2">
                {list.map((t) => (
                    <div key={t.id} className="card">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="text-lg font-semibold"><Link to={`/trips/${t.id}`} className="hover:text-emerald-700">{t.title}</Link></h2>
                            <Badge tone={tone[t.status]}>{t.status}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{fmtDate(t.start_date)} → {fmtDate(t.end_date)}</p>
                        <p className="text-sm text-slate-600">{t.travelers} traveler(s) · {fmtMoney(t.total_budget)} ·
                            {t.item_count} activities</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link to={`/trips/${t.id}`} className="btn-primary">Open</Link>
                            <button className="btn-secondary" onClick={() => duplicate(t)}>Use as template</button>
                            <button className="btn-danger" onClick={() => remove(t)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        )
    } 
    </div > 
  )
} 