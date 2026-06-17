import { Link } from 'react-router-dom'
import { ArrowRight, Gamepad2, Settings, Star, Zap } from 'lucide-react'
import { ALL_GAMES } from '@/games'
import { Card } from '@/shared/components'
import { Badge } from '@/shared/components'

const STATS = [
  { label: 'Juegos disponibles', value: ALL_GAMES.length, icon: Gamepad2, color: 'text-brand-400' },
  { label: 'Integración WAW', value: 'Listo', icon: Zap, color: 'text-green-400' },
  { label: 'Configuraciones', value: '∞', icon: Settings, color: 'text-yellow-400' },
  { label: 'Mobile First', value: '100%', icon: Star, color: 'text-pink-400' },
]

const difficultyColor: Record<string, 'purple' | 'green' | 'yellow'> = {
  easy: 'green',
  medium: 'yellow',
  hard: 'purple',
}

export default function Home() {
  return (
    <div className="space-y-8 p-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600/40 to-surface-50 p-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
            <Zap size={12} /> Plataforma de Juegos Promocionales
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">
            Game Studio
          </h1>
          <p className="mb-6 max-w-lg text-base text-white/60">
            Crea, configura y despliega juegos promocionales para tus tiendas Bitex.io. Sin backend,
            sin complicaciones — todo desde el navegador.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:scale-105"
            >
              Ver catálogo <ArrowRight size={16} />
            </Link>
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              <Settings size={16} /> Campaign Builder
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-3 py-4">
            <div className={`rounded-xl bg-white/5 p-2.5 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Game preview */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Juegos Disponibles</h2>
          <Link to="/catalog" className="text-sm text-brand-400 hover:text-brand-300">
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ALL_GAMES.map(({ meta }) => (
            <Card key={meta.id} hover>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{meta.name}</h3>
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2">{meta.description}</p>
                </div>
                <Badge color={difficultyColor[meta.difficulty] ?? 'gray'} className="ml-2 shrink-0">
                  {meta.difficulty}
                </Badge>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {meta.tags.map((tag) => (
                  <Badge key={tag} color="purple">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/preview/${meta.id}`}
                  className="flex-1 rounded-lg bg-brand-500/20 py-2 text-center text-xs font-medium text-brand-300 transition-colors hover:bg-brand-500/30"
                >
                  Probar
                </Link>
                <Link
                  to={`/builder?game=${meta.id}`}
                  className="flex-1 rounded-lg bg-white/5 py-2 text-center text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
                >
                  Configurar
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick start guide */}
      <Card>
        <h3 className="mb-4 font-semibold text-white">Guía rápida</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { step: '01', title: 'Elige un juego', desc: 'Explora el catálogo y selecciona el juego que mejor se adapte a tu campaña.' },
            { step: '02', title: 'Configura tu campaña', desc: 'Personaliza colores, textos, premios y configura la integración WAW.' },
            { step: '03', title: 'Exporta el código', desc: 'Copia el JSON de configuración o el snippet de embed para Bitex.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <span className="mt-0.5 shrink-0 font-mono text-xs font-bold text-brand-500">{step}</span>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
