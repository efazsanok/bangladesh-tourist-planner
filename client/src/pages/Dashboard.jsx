import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui'
import { loadWidgets } from '../lib/widgets'
export const route = { path: '/dashboard', access: 'auth', nav: 'Dashboard', navOrder: 5 }
// Widgets (e.g. weather alerts) are added by dropping files into components/dashboard-widgets.
const widgets = loadWidgets(import.meta.glob('../components/dashboard-widgets/*.jsx', { eager: true }))
const quickLinks = [
 { to: '/trips/new', label: 'Plan a new trip', icon: '🧭' },
 { to: '/my-trips', label: 'My trips', icon: '🎒' },
 { to: '/destinations', label: 'Browse destinations', icon: '🏝️' },
 { to: '/budget', label: 'Estimate a budget', icon: '💰' },
 { to: '/recommendations', label: 'Find a destination for my budget', icon: '🎯' },
 { to: '/weather', label: 'Check the weather', icon: '🌦️' },
]
export default function Dashboard() {
 const { user } = useAuth()
 return (
 <div>
 <PageHeader title={`Welcome, ${user.name.split(' ')[0]}!`} subtitle="Your trips, alerts and planning
tools in one place." />
 <div className="space-y-6">
 {widgets.map(({ Component }, i) => <Component key={i} />)}
 <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {quickLinks.map((q) => (
 <Link key={q.to} to={q.to} className="card flex items-center gap-3 transition hover:borderemerald-400 hover:shadow">
 <span className="text-2xl">{q.icon}</span>
 <span className="font-medium text-slate-800">{q.label}</span>
 </Link>
 ))}
 </section>
 </div>
 </div>
 )
}
