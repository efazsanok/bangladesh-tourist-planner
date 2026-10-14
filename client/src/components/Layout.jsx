import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
export default function Layout() {
 return (
 <div className="flex min-h-screen flex-col">
 <Navbar />
 <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
 <Outlet />
 </main>
 <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
 Weather &amp; Budget-Smart Bangladesh Tourist Planner · SE331 Capstone · Daffodil International
University
 </footer>
 </div>
 )
}
