import { useEffect, useState } from 'react'
import api, { errMsg } from '../api'
import DestinationCard from '../components/DestinationCard'
import { ErrorBox, PageHeader, Spinner } from '../components/ui'

export const route = { path: '/destinations', access: 'public', nav: 'Destinations', navOrder: 10 }

const DIVISIONS = ['Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet']
const empty = { search: '', division: '', category: '', season: '', budget: '' }

export default function Destinations() {
  const [filters, setFilters] = useState(empty)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], total: 0, limit: 12 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const change = (e) => { setPage(1); setFilters({ ...filters, [e.target.name]: e.target.value }) }

  useEffect(() => {
    // small delay so we do not call the API on every keystroke
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const params = { page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
        const { data } = await api.get('/destinations', { params })
        setResult(data)
      } catch (err) {
        setError(errMsg(err))
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, page])
  const pages = Math.max(Math.ceil(result.total / result.limit), 1)

  return (
    <div>
      <PageHeader title="Explore Bangladesh" subtitle="Search and filter destinations by division, category, best season and budget level." />

      <div className="card mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input name="search" className="input" placeholder="Search destinations..." aria-label="Search" value={filters.search} onChange={change} />
        <select name="division" className="input" aria-label="Division" value={filters.division} onChange={change}>
          <option value="">All divisions</option>
          {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select name="category" className="input" aria-label="Category" value={filters.category} onChange={change}>
          <option value="">All categories</option>
          <option value="beach">Beach</option><option value="hill">Hill</option>
          <option value="heritage">Heritage</option><option value="nature">Nature</option>
        </select>
        <select name="season" className="input" aria-label="Best season" value={filters.season} onChange={change}>
          <option value="">Any season</option>
          <option value="winter">Winter (Nov-Feb)</option><option value="summer">Summer (Mar-May)</option>
          <option value="monsoon">Monsoon (Jun-Oct)</option>
        </select>
        <select name="budget" className="input" aria-label="Budget level" value={filters.budget} onChange={change}>
          <option value="">Any budget</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
      </div>

      <ErrorBox>{error}</ErrorBox>
      {loading ? <Spinner /> : result.data.length === 0 ? (
        <div className="card text-center text-slate-600">
          No destinations match your filters.
          <button className="btn-secondary ml-3" onClick={() => setFilters(empty)}>Clear filters</button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((d) => <DestinationCard key={d.id} destination={d} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-sm text-slate-600">Page {page} of {pages}</span>
          <button className="btn-secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  )
}
