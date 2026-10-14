import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { navItems } from '../routes'

const visible = (item, user) => {
  if (item.access === 'public') return true
  if (item.access === 'guest') return !user
  if (item.access === 'admin') return user?.role === 'admin'
  return !!user
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const items = navItems.filter((i) => visible(i, user))

  const linkClass = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'}`

  const handleLogout = async () => {
    await logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Main navigation">
        <Link to="/" className="text-lg font-bold text-emerald-700">🌴 BD Tourist Planner</Link>

        <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          <span className="block text-xl leading-none">{open ? '✕' : '☰'}</span>
        </button>

        <div className={`${open ? 'absolute left-0 right-0 top-full border-b border-slate-200 bg-white p-4 shadow-lg' : 'hidden'} lg:static lg:flex lg:items-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
          <ul className="flex flex-col gap-1 lg:flex-row">
            {items.map((i) => (
              <li key={i.path}><NavLink to={i.path} end className={linkClass} onClick={() => setOpen(false)}>{i.nav}</NavLink></li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 lg:mt-0 lg:ml-3 lg:flex-row lg:items-center lg:border-0 lg:pt-0">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700 hover:text-emerald-700">👤 {user.name.split(' ')[0]}</Link>
                <button className="btn-secondary" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary">Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}