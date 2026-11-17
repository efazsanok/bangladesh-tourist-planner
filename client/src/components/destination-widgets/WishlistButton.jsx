import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errMsg } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { ErrorBox } from '../ui'

export const order = 1

export default function WishlistButton({ destination }) {
    const { user } = useAuth()
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!user) return
        api.get('/wishlist').then((r) => setSaved(r.data.data.some((d) => d.id === destination.id))).catch(() => { })
    }, [user, destination.id])

    if (!user) return <p className="text-sm text-slate-600"><Link className="font-medium text-emerald-700 
underline" to="/login">Log in</Link> to save this destination to your wishlist.</p>

    const toggle = async () => {
        setError('')
        try {
            if (saved) await api.delete(`/wishlist/${destination.id}`)
            else await api.post(`/wishlist/${destination.id}`)
            setSaved(!saved)
        } catch (err) { setError(errMsg(err)) }
    }

    return (
        <div className="space-y-2">
            <ErrorBox>{error}</ErrorBox>
            <button className={saved ? 'btn-secondary' : 'btn-primary'} onClick={toggle} aria-pressed={saved}>
                {saved ? '♥ Saved to wishlist' : '♡ Save to wishlist'}
            </button>
        </div>
    )
}