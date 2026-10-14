import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'
export default function ProtectedRoute({ access = 'public', children }) {
 const { user, loading } = useAuth()
 const location = useLocation()
 if (access === 'public') return children
 if (loading) return <Spinner />
 if (access === 'guest') return user ? <Navigate to={location.state?.from?.pathname || '/dashboard'}
replace /> : children
 if (!user) return <Navigate to="/login" state={{ from: location }} replace />
 if (access === 'admin' && user.role !== 'admin') return <Navigate to="/dashboard" replace />
 return children
}
