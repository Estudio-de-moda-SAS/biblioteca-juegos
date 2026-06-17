import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { ALL_GAMES } from '@/games'
import type { GameMeta } from '@/shared/types'
import { Badge, Card } from '@/shared/components'

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
}

const DIFFICULTY_COLORS: Record<string, 'green' | 'yellow' | 'purple'> = {
  easy: 'green',
  medium: 'yellow',
  hard: 'purple',
}

function GameCard({ meta }: { meta: GameMeta }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={meta.thumbnail}
          alt={meta.name}
          className="h-40 w-full object-cover"
          onError={(e) => {
            const el = e.target as HTMLImageElement
            el.style.background = 'linear-gradient(135deg, #6d28d9, #1e1e30)'
            el.style.height = '10rem'
            el.src = ''
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-2">
          <Badge color={DIFFICULTY_COLORS[meta.difficulty] ?? 'gray'}>
            {DIFFICULTY_LABELS[meta.difficulty] ?? meta.difficulty}
          </Badge>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-semibold text-white">{meta.name}</h3>
        <p className="mt-1 text-sm text-gray-400 line-clamp-3">{meta.description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {meta.tags.map((tag) => (
            <Badge key={tag} color="purple">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/preview/${meta.id}`}
          className="flex-1 rounded-lg bg-brand-500 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-600"
        >
          Probar juego
        </Link>
        <Link
          to={`/builder?game=${meta.id}`}
          className="flex-1 rounded-lg border border-white/10 bg-surface-100 py-2 text-center text-sm font-medium text-gray-300 transition-colors hover:bg-surface-200"
        >
          Configurar
        </Link>
      </div>
    </Card>
  )
}

export default function GameCatalog() {
  const [search, setSearch] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

  const filtered = ALL_GAMES.filter(({ meta }) => {
    const matchesSearch =
      !search ||
      meta.name.toLowerCase().includes(search.toLowerCase()) ||
      meta.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchesDifficulty = filterDifficulty === 'all' || meta.difficulty === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Catálogo de Juegos</h1>
        <p className="mt-1 text-sm text-gray-400">
          {ALL_GAMES.length} juego{ALL_GAMES.length !== 1 ? 's' : ''} disponible{ALL_GAMES.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar juegos…"
            className="w-full rounded-lg border border-white/10 bg-surface-100 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-500" />
          {['all', 'easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              onClick={() => setFilterDifficulty(d)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filterDifficulty === d
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-100 text-gray-400 hover:bg-surface-200 hover:text-white'
              }`}
            >
              {d === 'all' ? 'Todos' : DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-400">No se encontraron juegos con ese criterio.</p>
          <button
            onClick={() => { setSearch(''); setFilterDifficulty('all') }}
            className="mt-2 text-sm text-brand-400 hover:text-brand-300"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ meta }) => (
            <GameCard key={meta.id} meta={meta} />
          ))}
        </div>
      )}
    </div>
  )
}
