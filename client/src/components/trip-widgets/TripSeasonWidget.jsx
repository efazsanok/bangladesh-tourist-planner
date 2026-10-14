import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { fmtDate } from '../../lib/format'
import { Notice } from '../ui'
export const order = 10

export default function TripSeasonWidget({ trip, items }) {
    const [warnings, setWarnings] = useState([])
    useEffect(() => {
        api.get(`/trips/${trip.id}/season-check`).then((r) => setWarnings(r.data.warnings)).catch(() =>
            setWarnings([]))
    }, [trip.id, trip.start_date, trip.end_date, items.length])
    if (!warnings.length) return null
    return (
        <section className="space-y-3">
            {warnings.map((w) => (
                <Notice key={w.destinationId} tone="warn">
                    <p className="font-semibold">⚠️ {w.message}</p>
                    {w.betterDates.length > 0 && (
                        <p className="mt-1">Better dates: {w.betterDates.map((b) => `${b.month}
(${fmtDate(b.start_date)} – ${fmtDate(b.end_date)})`).join(' or ')}.</p>
                    )}
                    {w.alternatives.length > 0 && (
                        <p className="mt-1">Better places for your dates: {w.alternatives.map((a, i) => (
                            <span key={a.id}>{i > 0 && ', '}<Link className="font-medium underline"
                                to={`/destinations/${a.id}`}>{a.name}</Link></span>
                        ))}.</p>
                    )}
                </Notice>
            ))}
        </section>
    )
}
