import { useEffect, useState } from 'react'
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis }
    from 'recharts'
import api from '../../api'
import { Badge, Spinner } from '../ui'
export const order = 20
const COLORS = { Good: '#10b981', Fair: '#f59e0b', Poor: '#ef4444' }

export default function BestTimeWidget({ destination }) {
    const [data, setData] = useState(null)
    useEffect(() => {
        api.get(`/destinations/${destination.id}/best-time`).then((r) => setData(r.data)).catch(() => setData({
            months: []
        }))
    }, [destination.id])
    if (!data) return <Spinner />
    if (!data.months.length) return null
    const chart = data.months.map((m) => ({
        name: m.name, score: m.score, rainfall: m.rainfall, rating:
            m.rating
    }))
    return (
        <section className="card">
            <h2 className="text-lg font-semibold">Best time to visit</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-600">Recommended months:</span>
                {data.bestMonths.length ? data.bestMonths.map((m) => <Badge key={m.month}
                    tone="green">{m.name}</Badge>) : <span>No ideal month found</span>}
            </div>
            <div className="mt-4 h-72" role="img" aria-label="Monthly weather suitability chart">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" domain={[0, 100]} label={{
                            value: 'Score', angle: -90, position:
                                'insideLeft'
                        }} />
                        <YAxis yAxisId="right" orientation="right" label={{
                            value: 'Rain (mm)', angle: 90, position:
                                'insideRight'
                        }} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="score" name="Suitability score" radius={[4, 4, 0, 0]}>
                            {chart.map((c) => <Cell key={c.name} fill={COLORS[c.rating]} />)}
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#0ea5e9"
                            strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">Green = good, amber = fair, red = poor season. Based on
                stored monthly climate averages.</p>
        </section>
    )
}
