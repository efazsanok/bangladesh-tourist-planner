import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api'
import { useAuth } from '../context/AuthContext'
import { ErrorBox } from '../components/ui'
export const route = { path: '/register', access: 'guest' }
export default function Register() {
    const { saveSession } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
    const submit = async (e) => {
        e.preventDefault()
        setError('')
        if (form.name.trim().length < 2) return setError('Please enter your name')
        if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(form.password)) return setError('Password must be at least 8 characters and include a letter and a number')
        if (form.password !== form.confirm) return setError('Passwords do not match')
        setBusy(true)
        try {
            const { data } = await api.post('/auth/register', {
                name: form.name, email: form.email, password:
                    form.password
            })
            saveSession(data.token, data.user)
            navigate('/profile', { replace: true })
        } catch (err) {
            setError(errMsg(err))
        } finally {
            setBusy(false)
        }
    }
    return (
        <div className="mx-auto max-w-md">
            <div className="card">
                <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                    <ErrorBox>{error}</ErrorBox>
                    <div>
                        <label className="label" htmlFor="name">Full name</label>
                        <input id="name" name="name" className="input" autoComplete="name" value={form.name}
                            onChange={change} />
                    </div>
                    <div>
                        <label className="label" htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" className="input" autoComplete="email"
                            value={form.email} onChange={change} />
                    </div>
                    <div>
                        <label className="label" htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" className="input" autoComplete="newpassword" value={form.password} onChange={change} />
                        <p className="mt-1 text-xs text-slate-500">At least 8 characters with a letter and a number.</p>
                    </div>
                    <div>
                        <label className="label" htmlFor="confirm">Confirm password</label>
                        <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password"
                            value={form.confirm} onChange={change} />
                    </div>
                    <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account...' : 'Sign up'}</button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-600">
                    Already registered? <Link className="font-medium text-emerald-700 hover:underline" to="/login">Log
                        in</Link>
                </p>
            </div>
        </div>
    )
}