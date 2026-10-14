import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import TripForm from '../components/TripForm'
import { PageHeader } from '../components/ui'
import { addDaysStr, todayStr } from '../lib/format'
export const route = { path: '/trips/new', access: 'auth' }
export default function TripNew() {
 const navigate = useNavigate()
 const [params] = useSearchParams()
 const initial = {
 title: '',
 start_date: todayStr(),
 end_date: addDaysStr(todayStr(), 2),
 travelers: params.get('travelers') || 2,
 total_budget: params.get('budget') || '',
 }
const create = async (values) => {
 const { data } = await api.post('/trips', values)
 const dest = params.get('destination')
 navigate(`/trips/${data.trip.id}${dest ? `?destination=${dest}` : ''}`)
 }
 return (
 <div className="mx-auto max-w-2xl">
 <PageHeader title="Plan a new trip" subtitle="Set your dates, group size and budget. You will add
destinations and activities next." />
 <TripForm initial={initial} submitLabel="Create trip" onSubmit={create} />
 </div>
 )
}
