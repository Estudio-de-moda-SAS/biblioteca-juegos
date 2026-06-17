import { Link, useLocation } from 'react-router-dom'
import { Gamepad2, Library, X } from 'lucide-react'
import { cn } from '@/shared/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { to: '/', label: 'Catálogo de Juegos', icon: Library },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const { pathname } = useLocation()

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-surface-50 transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm shadow-lg shadow-brand-500/30">
              🎮
            </div>
            <div>
              <p className="text-sm font-bold text-white">Game Studio</p>
              <p className="text-[10px] text-gray-500">Biblioteca de Juegos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
            Navegación
          </p>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive(to)
                  ? 'bg-brand-500/20 text-brand-300 shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
              {isActive(to) && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-brand-500/10 p-3">
            <div className="flex items-center gap-2">
              <Gamepad2 size={16} className="text-brand-400" />
              <p className="text-xs font-medium text-brand-300">Integración Bitex.io</p>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Configura y exporta juegos listos para producción.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
