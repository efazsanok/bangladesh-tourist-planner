import { useEffect, useState } from 'react'
import api from '../api'
import WeatherPanel from '../components/WeatherPanel'
import { PageHeader } from '../components/ui'

export const route = { path: '/weather', access: 'public', nav: 'Weather', navOrder: 20 }

export default function Weather() {
  const [destinations, setDestinations] = useState([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    api.get('/destinations', { params: { limit: 100 } }).then((r) => {
      setDestinations(r.data.data)
      if (r.data.data.length) setSelected(String(r.data.data[0].id))
    })
  }, [])

  return (
    <div>
      <PageHeader title="Weather" subtitle="Live conditions and a 7-day forecast for any destination." />
      <div className="mb-6 max-w-sm">
        <label className="label" htmlFor="dest">Destination</label>
        <select id="dest" className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      {selected && <WeatherPanel destinationId={selected} />}
    </div>
  )
}
