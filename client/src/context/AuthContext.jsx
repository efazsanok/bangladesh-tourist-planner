import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../api'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
 const [user, setUser] = useState(() => {
 try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
 })
 const [loading, setLoading] = useState(!!localStorage.getItem('token'))
 const updateUser = useCallback((u) => {
 setUser(u)
 localStorage.setItem('user', JSON.stringify(u))
 }, [])
 const saveSession = useCallback((token, u) => {
 localStorage.setItem('token', token)
 updateUser(u)
 }, [updateUser])
 const clearSession = useCallback(() => {
 localStorage.removeItem('token')
 localStorage.removeItem('user')
 setUser(null)
 }, [])
 const logout = useCallback(async () => {
 try { await api.post('/auth/logout') } catch { /* stateless JWT: nothing to undo on the server */ }
 clearSession()
 }, [clearSession])
 // On first load, confirm the saved token is still valid and refresh the profile.
 useEffect(() => {
 const onForcedLogout = () => setUser(null)
 window.addEventListener('auth:logout', onForcedLogout)
 if (localStorage.getItem('token')) {
 api.get('/auth/me')
 .then((res) => updateUser(res.data.user))
 .catch(() => {})
 .finally(() => setLoading(false))
 }
 return () => window.removeEventListener('auth:logout', onForcedLogout)
 }, [updateUser])
 return (
 <AuthContext.Provider value={{ user, loading, saveSession, updateUser, logout }}>
 {children}
 </AuthContext.Provider>
 )
}

export const useAuth = () => useContext(AuthContext)
