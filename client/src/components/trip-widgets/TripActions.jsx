import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errMsg } from '../../api'
import { ErrorBox } from '../ui'

export const order = 0

export default function TripActions({ trip }) {
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const [busy, setBusy] = useState('')

    const downloadPdf = async () => {
        setError('')
        setBusy('pdf')
        try {
            const res = await api.get(`/trips/${trip.id}/pdf`, { responseType: 'blob' })
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = `${trip.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-summary.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) { setError(errMsg(err)) } finally { setBusy('') }
    }

    const duplicate = async () => {
        const start = window.prompt('Start date for the copy (YYYY-MM-DD). Leave empty to start today:', '')
        if (start === null) return
        setBusy('copy')
        try {
            const { data } = await api.post(`/trips/${trip.id}/duplicate`, { start_date: start || undefined })
            navigate(`/trips/${data.id}`)
        } catch (err) { setError(errMsg(err)); setBusy('') }
    }

    return (
        <div className="space-y-2">
            <ErrorBox>{error}</ErrorBox>
            <div className="flex flex-wrap gap-3">
                <button className="btn-secondary" onClick={downloadPdf} disabled={!!busy}>{busy === 'pdf' ?
                    'Preparing PDF...' : '⬇ Download PDF summary'}</button>
                <button className="btn-secondary" onClick={duplicate} disabled={!!busy}>{busy === 'copy' ?
                    'Copying...' : '⧉ Duplicate as template'}</button>
            </div>
        </div>
    )
} 