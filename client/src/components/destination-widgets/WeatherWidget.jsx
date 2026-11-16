import WeatherPanel from '../WeatherPanel'

export const order = 10

export default function WeatherWidget({ destination }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Live weather &amp; 7-day forecast</h2>
      <WeatherPanel destinationId={destination.id} />
    </section>
  )
}
