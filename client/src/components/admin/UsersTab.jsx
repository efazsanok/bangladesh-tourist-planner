import { useCallback, useEffect, useState } from 'react'
import api, { errMsg } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { ErrorBox, Spinner } from '../ui'

export default function UsersTab() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(() => { api.get('/admin/users').then((r) => setUsers(r.data.data)).catch((e) => setError(errMsg(e))) }, [])
  useEffect(() => { load() }, [load])

  const setRole = async (u, role) => {
    setError('')
    try { await api.put(`/admin/users/${u.id}/role`, { role }); load() } catch (err) { setError(errMsg(err)) }
  }
  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.email} and all of their trips?`)) return
    try { await api.delete(`/admin/users/${u.id}`); load() } catch (err) { setError(errMsg(err)) }
  }

  if (!users) return error ? <ErrorBox>{error}</ErrorBox> : <Spinner />
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">User accounts</h2>
      <ErrorBox>{error}</ErrorBox>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">Name</th><th>Email</th><th>Role</th><th>Trips</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{u.name}</td><td>{u.email}</td>
                <td>
                  <select aria-label={`Role for ${u.email}`} className="input w-auto py-1" value={u.role} disabled={u.id === me.id} onChange={(e) => setRole(u, e.target.value)}>
                    <option value="tourist">tourist</option><option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.trips}</td>
                <td className="px-3 text-right">{u.id !== me.id && <button className="text-red-600 hover:underline" onClick={() => remove(u)}>Delete</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}