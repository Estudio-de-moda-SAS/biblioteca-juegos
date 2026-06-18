import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getGame } from '@/games'
import type { GameId } from '@/shared/types'
import { useCampaignStore } from '@/store/campaignStore'

export default function GamePreview() {
  const { gameId } = useParams<{ gameId: string }>()

  const config = useCampaignStore((s) => s.config)
  const setGameId = useCampaignStore((s) => s.setGameId)

  const id = gameId as GameId
  const entry = id ? getGame(id) : null

  useEffect(() => {
    if (id) setGameId(id)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!entry) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-8 text-center">
        <p className="text-lg text-white">
          Juego no encontrado: <code className="text-brand-400">{gameId}</code>
        </p>
        <Link to="/" className="text-sm text-brand-400 hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    )
  }

  const { meta, Component } = entry

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
          to="/"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={16} />
          Inicio
        </Link>

        <span className="text-sm font-medium text-white">{meta.name}</span>

        {/* Espacio reservado para acciones futuras */}
        <div className="w-24" />
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
