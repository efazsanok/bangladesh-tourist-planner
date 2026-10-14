export function loadWidgets(modules) {
 return Object.values(modules)
 .filter((m) => m.default)
 .map((m) => ({ Component: m.default, order: m.order ?? 100 }))
 .sort((a, b) => a.order - b.order)
}