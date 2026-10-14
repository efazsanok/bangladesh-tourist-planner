import { Link } from 'react-router-dom'

export const route = { path: '/', access: 'public', nav: 'Home', navOrder: 0 }

const features = [
  { icon: '🌦️', title: 'Weather-smart', text: '7-day forecasts, daily Good / Caution / Avoid ratings and storm or heat alerts for your trip dates.' },
  { icon: '💰', title: 'Budget-smart', text: 'Itemised cost estimates, expense tracking and warnings before you overspend.' },
  { icon: '🗺️', title: 'Itinerary builder', text: 'Plan day by day, reorder activities and swap outdoor plans when the weather turns bad.' },
  { icon: '🏝️', title: 'Right place, right season', text: 'Best-time charts and destination recommendations that fit your budget and interests.' },
]

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-14 text-center text-white sm:px-12">
        <h1 className="text-3xl font-extrabold sm:text-5xl">Travel Bangladesh safer, cheaper and better prepared</h1>
        <p className="mx-auto mt-4 max-w-2xl text-emerald-50 sm:text-lg">
          From Cox&apos;s Bazar to the Sundarbans, Sylhet and the hill districts - plan with live weather and a realistic budget in one place.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/destinations" className="rounded-lg bg-white px-5 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50">Explore destinations</Link>
          <Link to="/trips/new" className="rounded-lg border border-white/60 px-5 py-2.5 font-semibold text-white hover:bg-white/10">Plan a trip</Link>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card">
            <div className="text-3xl">{f.icon}</div>
            <h2 className="mt-3 font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}