import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

interface TopBarProps {
  onMenuClick: () => void
}

const BREADCRUMBS: Record<string, string> = {
  '/': 'Dashboard',
  '/catalog': 'Catálogo de Juegos',
  '/builder': 'Campaign Builder',
  '/preview': 'Vista Previa',
}

function getBreadcrumb(pathname: string): string {
  for (const [path, label] of Object.entries(BREADCRUMBS)) {
    if (path !== '/' && pathname.startsWith(path)) return label
  }
  return BREADCRUMBS['/'] ?? 'Dashboard'
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { pathname } = useLocation()
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/10 bg-surface-50 px-4">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>
      <div>
        <h2 className="text-base font-semibold text-white">{breadcrumb}</h2>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 sm:inline-flex">
          ● MVP v0.1
        </span>
      </div>
    </header>
  )
}
