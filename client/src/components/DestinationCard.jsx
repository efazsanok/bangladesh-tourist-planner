import { Link } from 'react-router-dom'
import { Badge } from './ui'
import { cap } from '../lib/format'

export default function DestinationCard({ destination: d, action }) {
  return (
    <article className="card flex flex-col overflow-hidden p-0 transition hover:shadow-md">
      <Link to={`/destinations/${d.id}`}>
        <img
          src={d.image_url} alt={d.name} loading="lazy" className="h-44 w-full bg-slate-200 object-cover"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="green">{cap(d.category)}</Badge>
          <Badge tone="blue">{d.division}</Badge>
          <Badge tone="amber">{cap(d.budget_level)} budget</Badge>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          <Link to={`/destinations/${d.id}`} className="hover:text-emerald-700">{d.name}</Link>
        </h3>
        {d.summary && <p className="mt-1 flex-1 text-sm text-slate-600">{d.summary}{d.summary.length >= 160 ? '…' : ''}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </article>
  )
}
