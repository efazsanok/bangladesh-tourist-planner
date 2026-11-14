// Free OpenStreetMap embed (no API key needed)
export default function MapEmbed({ lat, lng, name }) {
  const d = 0.08
  const bbox = [lng - d, lat - d, lng + d, lat + d].join('%2C')
  return (
    <iframe
      title={`Map of ${name}`}
      className="h-72 w-full rounded-xl border border-slate-200"
      loading="lazy"
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`}
    />
  )
}
