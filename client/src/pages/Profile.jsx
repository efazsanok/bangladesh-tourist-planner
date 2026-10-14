import { useState } from 'react'
import api, { errMsg } from '../api'
import { useAuth } from '../context/AuthContext'
import { ErrorBox, Notice, PageHeader } from '../components/ui'
export const route = { path: '/profile', access: 'auth' }
const STYLES = ['beach', 'hill', 'heritage', 'nature']
export default function Profile() {
    const { user, updateUser } = useAuth()
    const [form, setForm] = useState({
        name: user.name || '',
        home_city: user.home_city || '',
        travel_style: user.travel_style || '',
        budget_min: user.budget_min ?? '',
        budget_max: user.budget_max ?? '',
    })
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)
    const [busy, setBusy] = useState(false)
    const change = (e) => { setSaved(false); setForm({ ...form, [e.target.name]: e.target.value }) }
    const submit = async (e) => {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            const payload = {
                name: form.name,
                home_city: form.home_city || null,
                travel_style: form.travel_style || null,
                budget_min: form.budget_min === '' ? null : Number(form.budget_min),
                budget_max: form.budget_max === '' ? null : Number(form.budget_max),
            }
            const { data } = await api.put('/auth/profile', payload)
            updateUser(data.user)
            setSaved(true)
        } catch (err) {
            setError(errMsg(err))
        } finally {
            setBusy(false)
        }
    }
    return (
        <div className="mx-auto max-w-2xl">
            <PageHeader title="My profile" subtitle={`${user.email} · ${user.role}`} />
            <form onSubmit={submit} className="card space-y-4">
                <ErrorBox>{error}</ErrorBox>
                {saved && <Notice tone="good">Profile saved.</Notice>}
                <div>
                    <label className="label" htmlFor="name">Full name</label>
                    <input id="name" name="name" className="input" value={form.name} onChange={change} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="label" htmlFor="home_city">Home city</label>
                        <input id="home_city" name="home_city" className="input" value={form.home_city}
                            onChange={change} />
                    </div>
                    <div>
                        <label className="label" htmlFor="travel_style">Preferred travel style</label>
                        <select id="travel_style" name="travel_style" className="input" value={form.travel_style}
                            onChange={change}>
                            <option value="">No preference</option>
                            {STYLES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() +
                                s.slice(1)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label" htmlFor="budget_min">Default budget - minimum (৳)</label>
                        <input id="budget_min" name="budget_min" type="number" min="0" className="input"
                            value={form.budget_min} onChange={change} />
                    </div>
                    <div>
                        <label className="label" htmlFor="budget_max">Default budget - maximum (৳)</label>
                        <input id="budget_max" name="budget_max" type="number" min="0" className="input"
                            value={form.budget_max} onChange={change} />
                    </div>
                </div>
                <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</button>
            </form>
        </div>
    )
}

