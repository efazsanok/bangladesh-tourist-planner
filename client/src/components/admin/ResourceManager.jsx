import { useCallback, useEffect, useState } from 'react'
import api, { errMsg } from '../../api'
import { ErrorBox, Spinner } from '../ui'

export default function ResourceManager({ resource, title, fields, destinations, filterByDestination }) {
  const [rows, setRows] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [destFilter, setDestFilter] = useState('')
  const [form, setForm] = useState(null)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get(`/admin/${resource}`, { params: { page, destination_id: destFilter || undefined } })
      .then((r) => { setRows(r.data.data); setTotal(r.data.total) })
      .catch((e) => setError(errMsg(e)))
  }, [resource, page, destFilter])
  useEffect(() => { load() }, [load])

  const blank = () => Object.fromEntries(fields.map((f) => [f.name, f.default ?? '']))
  const openNew = () => { setEditId(null); setForm(blank()); setError('') }
  const openEdit = (row) => { setEditId(row.id); setForm(Object.fromEntries(fields.map((f) => [f.name, row[f.name] ?? '']))); setError('') }
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editId) await api.put(`/admin/${resource}/${editId}`, form)
      else await api.post(`/admin/${resource}`, form)
      setForm(null)
      load()
    } catch (err) { setError(errMsg(err)) }
  }

  const remove = async (row) => {
    if (!window.confirm('Delete this record?')) return
    try { await api.delete(`/admin/${resource}/${row.id}`); load() } catch (err) { setError(errMsg(err)) }
  }

  const optionsFor = (f) => (f.name === 'destination_id' ? destinations.map((d) => ({ value: d.id, label: d.name })) : f.options)
  const display = (row, f) => {
    if (f.name === 'destination_id') return row.destination_name
    if (f.name === 'is_outdoor') return row.is_outdoor ? 'Outdoor' : 'Indoor'
    const v = row[f.name]
    return typeof v === 'string' && v.length > 40 ? `${v.slice(0, 40)}…` : v
  }
  const columns = fields.filter((f) => f.table !== false)
  const pages = Math.max(Math.ceil(total / 20), 1)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex gap-2">
          {filterByDestination && (
            <select aria-label="Filter by destination" className="input" value={destFilter} onChange={(e) => { setPage(1); setDestFilter(e.target.value) }}>
              <option value="">All destinations</option>{destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <button className="btn-primary whitespace-nowrap" onClick={openNew}>+ Add new</button>
        </div>
      </div>
      <ErrorBox>{error}</ErrorBox>

      {form && (
        <form onSubmit={save} className="card grid gap-3 sm:grid-cols-2" noValidate>
          {fields.map((f) => (
            <div key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <label className="label" htmlFor={`f-${f.name}`}>{f.label}</label>
              {f.type === 'select' ? (
                <select id={`f-${f.name}`} name={f.name} className="input" value={form[f.name]} onChange={change}>
                  <option value="">Select...</option>{optionsFor(f).map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea id={`f-${f.name}`} name={f.name} rows={3} className="input" value={form[f.name]} onChange={change} />
              ) : (
                <input id={`f-${f.name}`} name={f.name} type={f.type === 'number' ? 'number' : 'text'} step={f.step} className="input" value={form[f.name]} onChange={change} />
              )}
            </div>
          ))}
          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary">{editId ? 'Save changes' : 'Create'}</button>
            <button type="button" className="btn-secondary" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      {!rows ? <Spinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{columns.map((f) => <th key={f.name} className="px-3 py-2">{f.label}</th>)}<th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  {columns.map((f) => <td key={f.name} className="px-3 py-2">{display(row, f)}</td>)}
                  <td className="space-x-3 whitespace-nowrap px-3 py-2 text-right">
                    <button className="text-emerald-700 hover:underline" onClick={() => openEdit(row)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => remove(row)}>Delete</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="px-3 py-6 text-center text-slate-500" colSpan={columns.length + 1}>No records.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-sm text-slate-600">Page {page} of {pages}</span>
          <button className="btn-secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </section>
  )
}