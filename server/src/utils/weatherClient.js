const cache = new Map();
const TTL_MS = 30 * 60 * 1000;

const WMO = (code) => {
  if (code === 0) return { text: 'Clear sky', icon: '☀️' };
  if (code <= 2) return { text: 'Partly cloudy', icon: '⛅' };
  if (code === 3) return { text: 'Overcast', icon: '☁️' };
  if (code === 45 || code === 48) return { text: 'Fog', icon: '🌫️' };
  if (code >= 51 && code <= 57) return { text: 'Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 67) return { text: 'Rain', icon: '🌧️' };
  if (code >= 80 && code <= 82) return { text: 'Rain showers', icon: '🌧️' };
  if (code >= 95) return { text: 'Thunderstorm', icon: '⛈️' };
  return { text: 'Cloudy', icon: '☁️' };
};

function normalize(j) {
  const c = j.current || {};
  const d = j.daily || {};
  const cur = WMO(c.weather_code);
  return {
    current: {
      temperature: c.temperature_2m, humidity: c.relative_humidity_2m, rainfall: c.precipitation,
      wind: c.wind_speed_10m, description: cur.text, icon: cur.icon,
    },
    daily: (d.time || []).map((date, i) => {
      const w = WMO(d.weather_code?.[i]);
      return {
        date,
        tempMax: d.temperature_2m_max?.[i], tempMin: d.temperature_2m_min?.[i],
        rainChance: d.precipitation_probability_max?.[i] ?? 0, rainMm: d.precipitation_sum?.[i] ?? 0,
        wind: d.wind_speed_10m_max?.[i] ?? 0, humidity: d.relative_humidity_2m_mean?.[i] ?? null,
        description: w.text, icon: w.icon,
      };
    }),
  };
}

async function fetchForecast(lat, lng) {
  const key = `${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < TTL_MS) return hit.data;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: lat, longitude: lng, timezone: 'Asia/Dhaka', forecast_days: '7',
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean,weather_code',
  }).toString();

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Weather API status ${res.status}`);
    const data = normalize(await res.json());
    cache.set(key, { time: Date.now(), data });
    return data;
  } catch (err) {
    if (hit) return { ...hit.data, stale: true };
    const e = new Error('Weather service is temporarily unavailable');
    e.status = 502;
    throw e;
  }
}

module.exports = { fetchForecast };
