import { Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { appRoutes } from './routes'
function NotFound() {
 return (
 <div className="py-20 text-center">
 <h1 className="text-4xl font-bold text-slate-900">404</h1>
 <p className="mt-2 text-slate-600">This page does not exist (or has not been built yet).</p>
 <Link to="/" className="btn-primary mt-6">Back to home</Link>
 </div>
 )
}
export default function App() {
 return (
 <Routes>
 <Route element={<Layout />}>
 {appRoutes.map(({ path, access, Component }) => (
 <Route key={path} path={path} element={<ProtectedRoute access={access}><Component
/></ProtectedRoute>} />
 ))}
 <Route path="*" element={<NotFound />} />
 </Route>
 </Routes>
 )
}