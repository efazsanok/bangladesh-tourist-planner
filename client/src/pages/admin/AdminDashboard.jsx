import { useEffect, useState } from 'react'
import api from '../../api'
import ResourceManager from '../../components/admin/ResourceManager'
import StatsTab from '../../components/admin/StatsTab'
import UsersTab from '../../components/admin/UsersTab'
import { PageHeader } from '../../components/ui'

export const route = { path: '/admin', access: 'admin', nav: 'Admin', navOrder: 90 }

const CATS = ['beach', 'hill', 'heritage', 'nature']
const dest = { name: 'destination_id', label: 'Destination', type: 'select' }

const CONFIG = {
  destinations: { title: 'Destinations', fields: [
    { name: 'name', label: 'Name' }, { name: 'division', label: 'Division' },
    { name: 'category', label: 'Category', type: 'select', options: CATS },
    { name: 'best_season', label: 'Best season', type: 'select', options: ['winter', 'summer', 'monsoon', 'year_round'] },
    { name: 'budget_level', label: 'Budget level', type: 'select', options: ['low', 'medium', 'high'] },
    { name: 'latitude', label: 'Latitude', type: 'number', step: 'any', table: false }, { name: 'longitude', label: 'Longitude', type: 'number', step: 'any', table: false },
    { name: 'food_per_day', label: 'Food / person / day (৳)', type: 'number', table: false },
    { name: 'local_transport_per_day', label: 'Local transport / day (৳)', type: 'number', table: false },
    { name: 'activities_per_day', label: 'Activities / person / day (৳)', type: 'number', table: false },
    { name: 'image_url', label: 'Image URL', table: false }, { name: 'gallery_urls', label: 'Gallery URLs (comma separated)', table: false },
    { name: 'description', label: 'Description', type: 'textarea', table: false }, { name: 'travel_tips', label: 'Travel tips', type: 'textarea', table: false },
  ] },
  attractions: { title: 'Attractions', filter: true, fields: [
    dest, { name: 'name', label: 'Name' }, { name: 'description', label: 'Description', table: false },
    { name: 'is_outdoor', label: 'Outdoor?', type: 'select', options: [{ value: 1, label: 'Outdoor' }, { value: 0, label: 'Indoor' }], default: 1 },
    { name: 'est_cost', label: 'Cost (৳)', type: 'number', default: 0 },
  ] },
  hotels: { title: 'Hotels', filter: true, fields: [
    dest, { name: 'name', label: 'Hotel name' },
    { name: 'category', label: 'Category', type: 'select', options: ['budget', 'standard', 'luxury'] },
    { name: 'price_per_night', label: 'Price / night (৳)', type: 'number' },
  ] },
  transport: { title: 'Transport costs', filter: true, fields: [
    dest, { name: 'mode', label: 'Mode', type: 'select', options: ['bus', 'train', 'air', 'launch'] },
    { name: 'cost_per_person', label: 'Cost / person one way (৳)', type: 'number' },
  ] },
  climate: { title: 'Monthly climate data', filter: true, fields: [
    dest, { name: 'month', label: 'Month (1-12)', type: 'number' },
    { name: 'avg_temp_c', label: 'Avg temp (°C)', type: 'number', step: 'any' },
    { name: 'avg_rainfall_mm', label: 'Rainfall (mm)', type: 'number', step: 'any' },
    { name: 'avg_humidity', label: 'Humidity (%)', type: 'number', step: 'any' },
  ] },
}

const TABS = [['stats', 'Statistics'], ...Object.entries(CONFIG).map(([k, v]) => [k, v.title]), ['users', 'Users']]

export default function AdminDashboard() {
  const [tab, setTab] = useState('stats')
  const [destinations, setDestinations] = useState([])
  useEffect(() => { api.get('/destinations', { params: { limit: 100 } }).then((r) => setDestinations(r.data.data)) }, [])
  const cfg = CONFIG[tab]

  return (
    <div>
      <PageHeader title="Admin dashboard" subtitle="Manage destinations, costs, climate data and user accounts." />
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === key ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-100'}`}>{label}</button>
        ))}
      </div>
      {tab === 'stats' && <StatsTab />}
      {tab === 'users' && <UsersTab />}
      {cfg && <ResourceManager key={tab} resource={tab} title={cfg.title} fields={cfg.fields} destinations={destinations} filterByDestination={cfg.filter} />}
    </div>
  )
}