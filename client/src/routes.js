const modules = import.meta.glob('./pages/**/*.jsx', { eager: true })
export const appRoutes = Object.values(modules)
 .filter((m) => m.route && m.default)
 .map((m) => ({ access: 'public', ...m.route, Component: m.default }))
export const navItems = appRoutes
 .filter((r) => r.nav)
 .sort((a, b) => (a.navOrder ?? 50) - (b.navOrder ?? 50))
