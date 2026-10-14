export function Spinner({ label = 'Loading...' }) {
 return (
 <div className="flex items-center justify-center gap-3 py-10 text-slate-500" role="status">
 <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
/>
 <span className="text-sm">{label}</span>
 </div>
 )
}
export function ErrorBox({ children }) {
 if (!children) return null
 return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red700">{children}</div>
}
export function Notice({ tone = 'info', children }) {
 const tones = {
 info: 'border-sky-200 bg-sky-50 text-sky-800',
 warn: 'border-amber-200 bg-amber-50 text-amber-800',
 good: 'border-emerald-200 bg-emerald-50 text-emerald-800',
 bad: 'border-red-200 bg-red-50 text-red-700',
 }
 return <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
}
export function PageHeader({ title, subtitle, children }) {
 return (
 <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
 <div>
 <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
 {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
 </div>
 {children}
 </div>
 )
}
export function Badge({ children, tone = 'slate' }) {
 const tones = {
 slate: 'bg-slate-100 text-slate-700',
 green: 'bg-emerald-100 text-emerald-800',
 amber: 'bg-amber-100 text-amber-800',
 red: 'bg-red-100 text-red-700',
 blue: 'bg-sky-100 text-sky-800',
 }
 return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium
${tones[tone]}`}>{children}</span>
}
export const ratingTone = (rating) => ({ Good: 'green', Fair: 'amber', Caution: 'amber', Poor: 'red', Avoid:
'red' }[rating] || 'slate')