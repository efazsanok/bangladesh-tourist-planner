import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api'
import { useAuth } from '../context/AuthContext'
import { ErrorBox } from '../components/ui'
export const route = { path: '/login', access: 'guest' }
export default function Login() {
    const { saveSession } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
    const submit = async (e) => {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            const { data } = await api.post('/auth/login', form)
            saveSession(data.token, data.user)
            navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
        } catch (err) {
            setError(errMsg(err))
        } finally {
            setBusy(false)
        }
    }
    return (
        <div className="mx-auto max-w-md">
            <div className="card">
                <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
                <p className="mt-1 text-sm text-slate-600">Welcome back! Continue planning your trip.</p>
                <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                    <ErrorBox>{error}</ErrorBox>
                    <div>
                        <label className="label" htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" autoComplete="email" required className="input"
                            value={form.email} onChange={change} />
                    </div>
                    <div>
                        <label className="label" htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" autoComplete="current-password" required
                            className="input" value={form.password} onChange={change} />
                    </div>
                    <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in...' : 'Login '}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-600">
                    New here? <Link className="font-medium text-emerald-700 hover:underline" to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    )
}
