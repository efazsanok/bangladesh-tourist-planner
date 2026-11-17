import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errMsg } from '../api'
import DestinationCard from '../components/DestinationCard'
import { ErrorBox, PageHeader, Spinner } from '../components/ui'

export const route = { path: '/wishlist', access: 'auth', nav: 'Wishlist', navOrder: 60 }

export default function Wishlist() {
    const [items, setItems] = useState(null)
    const [error, setError] = useState('')

    const load = useCallback(() => {
        api.get('/wishlist').then((r) => setItems(r.data.data)).catch((e) => setError(errMsg(e)))
    }, [])
    useEffect(() => { load() }, [load])

    const remove = async (id) => {
        try { await api.delete(`/wishlist/${id}`); load() } catch (err) { setError(errMsg(err)) }
    }

    if (!items) return error ? <ErrorBox>{error}</ErrorBox> : <Spinner />
    return (
        <div>
            <PageHeader title="My wishlist" subtitle="Destinations you want to visit someday." />
            <ErrorBox>{error}</ErrorBox>
            {items.length === 0 ? (<div className="card text-center text-slate-600">Your wishlist is empty. <Link className="font medium text-emerald-700 underline" to="/destinations">Browse destinations</Link></div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((d) => (
                        <DestinationCard key={d.id} destination={d} action={<button className="btn-secondary w-full"
                            onClick={() => remove(d.id)}>Remove from wishlist</button>} />
                    ))}
                </div>
            )}
        </div>
    )
} 