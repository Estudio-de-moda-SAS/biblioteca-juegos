import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Settings } from 'lucide-react'
import { getGame } from '@/games'
import type { GameId } from '@/shared/types'
import { useCampaignStore } from '@/store/campaignStore'

export default function GamePreview() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const fromBuilder = searchParams.get('from') === 'builder'

  const config = useCampaignStore((s) => s.config)
  const setGameId = useCampaignStore((s) => s.setGameId)

  const id = gameId as GameId
  const entry = id ? getGame(id) : null

  // Sincroniza el store con el juego de la URL
  useEffect(() => {
    if (id) setGameId(id)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!entry) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-8 text-center">
        <p className="text-lg text-white">
          Juego no encontrado: <code className="text-brand-400">{gameId}</code>
        </p>
        <Link to="/catalog" className="text-sm text-brand-400 hover:underline">
          ← Volver al catálogo
        </Link>
      </div>
    )
  }

  const { meta, Component } = entry

  // Esperar a que el store tenga el config correcto para este juego.
  // El efecto llama setGameId(id) pero React ejecuta efectos después del render,
  // así que en el primer render config.gameId puede ser el juego anterior.
  const configReady = config.gameId === id
  if (!configReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-surface-50 px-4 py-3">
        <Link
          to={fromBuilder ? '/builder' : '/catalog'}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={16} />
          {fromBuilder ? 'Volver al builder' : 'Catálogo'}
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{meta.name}</span>
          {fromBuilder && (
            <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs text-brand-300">
              Vista previa del builder
            </span>
          )}
        </div>

        <Link
          to={`/builder?game=${id}`}
          className="flex items-center gap-1.5 rounded-lg bg-surface-100 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-surface-200 hover:text-white"
        >
          <Settings size={14} /> Configurar
        </Link>
      </div>

      {/* Juego */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto">
          <Component config={config} />
        </div>
      </div>
    </div>
  )
}
