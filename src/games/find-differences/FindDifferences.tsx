import { useCallback, useEffect, useRef, useState } from 'react'
import { Clock, Eye } from 'lucide-react'
import type {
  CampaignConfig,
  DifferenceArea,
  FindDifferencesSettings,
  GameResult,
} from '@/shared/types'
import { prizeByThreshold, formatTime } from '@/shared/utils'
import { useTimer } from '@/shared/hooks'
import { cn } from '@/shared/utils'
import { GameStartScreen, GameResultScreen } from '@/shared/components'
import { FIND_DIFFERENCES_INSTRUCTIONS } from './FindDifferencesConfig'

// ─── Tipos internos ──────────────────────────────────────────────────────────
interface Ripple {
  id: string
  x: number
  y: number
  correct: boolean
}

// ─── Panel individual de imagen ──────────────────────────────────────────────
interface ImagePanelProps {
  imageUrl: string
  label: string
  differences: DifferenceArea[]
  foundIds: Set<string>
  showHints: boolean
  onDifferenceClick: (diff: DifferenceArea) => void
  onMissClick: () => void
}

function ImagePanel({
  imageUrl,
  label,
  differences,
  foundIds,
  showHints,
  onDifferenceClick,
  onMissClick,
}: ImagePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])

  const addRipple = (x: number, y: number, correct: boolean) => {
    const id = `${Date.now()}-${Math.random()}`
    setRipples((prev) => [...prev, { id, x, y, correct }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 800)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100

    const hit = differences.find((d) => {
      if (foundIds.has(d.id)) return false
      const dx = xPct - d.x
      const dy = yPct - d.y
      // Radio de detección ligeramente amplificado para facilitar el toque en móvil
      return Math.sqrt(dx * dx + dy * dy) <= d.radius * 1.6
    })

    if (hit) {
      addRipple(xPct, yPct, true)
      onDifferenceClick(hit)
    } else {
      addRipple(xPct, yPct, false)
      onMissClick()
    }
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="mb-1.5 text-center text-xs font-semibold uppercase tracking-widest text-white/40">
        {label}
      </p>
      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative cursor-crosshair overflow-hidden rounded-xl border border-white/10 shadow-2xl select-none"
        style={{ aspectRatio: '8 / 5' }}
      >
        <img
          src={imageUrl}
          alt={label}
          className="pointer-events-none h-full w-full object-cover"
          draggable={false}
        />

        {/* Marcadores de diferencias encontradas (anillo verde permanente) */}
        {differences
          .filter((d) => foundIds.has(d.id))
          .map((d) => (
            <div
              key={`found-${d.id}`}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-green-400 bg-green-400/20 shadow-lg shadow-green-500/40 transition-all duration-300"
              style={{
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: `${d.radius * 2.4}%`,
                height: `${d.radius * 2.4}%`,
              }}
            >
              {/* Checkmark central */}
              <div className="flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 text-green-400" fill="none" stroke="currentColor" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          ))}

        {/* Pistas opcionales: anillos pulsantes alrededor de diferencias no encontradas */}
        {showHints &&
          differences
            .filter((d) => !foundIds.has(d.id))
            .map((d) => (
              <div
                key={`hint-${d.id}`}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-dashed border-yellow-400/80 bg-yellow-400/5"
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: `${d.radius * 3}%`,
                  height: `${d.radius * 3}%`,
                }}
              />
            ))}

        {/* Ripples de feedback de clic */}
        {ripples.map((r) => (
          <div
            key={r.id}
            className={cn(
              'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
              r.correct
                ? 'border-green-400 bg-green-400/30'
                : 'border-red-500 bg-red-500/20'
            )}
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: '10%',
              height: '10%',
              animation: 'ripple 0.7s ease-out forwards',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
type Screen = 'start' | 'instructions' | 'playing' | 'result'

interface Props {
  config: CampaignConfig
  onComplete?: (result: GameResult) => void
}

export function FindDifferences({ config, onComplete }: Props) {
  const settings = config.gameSettings as FindDifferencesSettings
  const imageUrl = settings.imageUrl ?? ''
  const imageUrlAlt = settings.imageUrlAlt ?? settings.imageUrl ?? ''
  const differences: DifferenceArea[] = settings.differences ?? []
  const showTimer = settings.showTimer ?? true
  const timeLimit = settings.timeLimit ?? null

  const [screen, setScreen] = useState<Screen>('start')
  const [result, setResult] = useState<GameResult | null>(null)
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set())
  const [showHints, setShowHints] = useState(false)
  const [missCount, setMissCount] = useState(0)

  const { time, start: startTimer, stop: stopTimer, restart: restartTimer } = useTimer({
    limit: timeLimit ?? undefined,
    onLimit: () => handleFinish(false),
  })

  const initGame = useCallback(() => {
    setFoundIds(new Set())
    setShowHints(false)
    setMissCount(0)
    restartTimer()
  }, [restartTimer])

  useEffect(() => {
    if (screen === 'playing') initGame()
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFinish(success: boolean) {
    stopTimer()
    const thresholds = (config.gameSettings as FindDifferencesSettings).missThresholds ?? [0, 2, 3, 4]
    const prize = prizeByThreshold(missCount, config.prizes, thresholds)
    const found = foundIds.size
    const total = differences.length
    const accuracy = total > 0 ? found / total : 0
    const penalty = Math.min(missCount * 20, 400)

    const gameResult: GameResult = {
      gameId: 'find-differences',
      score: success ? Math.max(0, Math.round(accuracy * 1000 - penalty)) : Math.round(accuracy * 500),
      timeElapsed: time,
      completed: success,
      prize: prize,
    }
    setResult(gameResult)
    onComplete?.(gameResult)
    setScreen('result')
  }

  function handleDifferenceFound(diff: DifferenceArea) {
    setFoundIds((prev) => {
      const next = new Set(prev)
      next.add(diff.id)
      if (next.size === differences.length) {
        setTimeout(() => handleFinish(true), 700)
      }
      return next
    })
  }

  // ── Pantallas ─────────────────────────────────────────────────────────────
  if (screen === 'start') {
    return <GameStartScreen config={config} icon="🔍" onStart={() => setScreen('instructions')} />
  }

  if (screen === 'instructions') {
    return (
      <div
        className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center"
        style={{ background: `linear-gradient(135deg, ${config.primaryColor}33, ${config.secondaryColor})` }}
      >
        <div className="text-5xl">🔍</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">¿Cómo jugar?</h2>
          <p className="text-sm text-white/60">
            Encuentra las Diferencias — {differences.length} diferencias ocultas
          </p>
        </div>
        <ol className="w-full max-w-xs space-y-3 text-left">
          {FIND_DIFFERENCES_INSTRUCTIONS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-white/80">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: config.primaryColor }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <button
          onClick={() => { setScreen('playing'); startTimer() }}
          className="mt-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-xl transition-transform hover:scale-105"
          style={{ backgroundColor: config.primaryColor }}
        >
          ¡Comenzar!
        </button>
      </div>
    )
  }

  if (screen === 'result' && result) {
    return <GameResultScreen config={config} result={result} onReset={() => setScreen('start')} />
  }

  const progress = differences.length > 0 ? (foundIds.size / differences.length) * 100 : 0

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: `linear-gradient(180deg, ${config.secondaryColor} 0%, #0f0f1a 100%)` }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        style={{ backgroundColor: config.primaryColor + '22', borderBottom: `1px solid ${config.primaryColor}44` }}
      >
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Eye size={14} />
          <span>{foundIds.size} / {differences.length} encontradas</span>
          {missCount > 0 && (
            <span className="text-red-400/70">· {missCount} fallo{missCount !== 1 ? 's' : ''}</span>
          )}
        </div>

        {showTimer && (
          <div className={cn(
            'flex items-center gap-1.5 font-mono text-sm font-bold',
            timeLimit && time >= timeLimit * 0.75 ? 'text-red-400' : 'text-white'
          )}>
            <Clock size={14} className="text-white/60" />
            {formatTime(time)}
            {timeLimit && <span className="text-xs text-white/40">/ {formatTime(timeLimit)}</span>}
          </div>
        )}

        <button
          onClick={() => setShowHints((h) => !h)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
            showHints
              ? 'bg-yellow-500/30 text-yellow-300'
              : 'text-white/50 hover:bg-white/10 hover:text-white'
          )}
        >
          💡 {showHints ? 'Ocultar pistas' : 'Pistas'}
        </button>
      </div>

      {/* ── Barra de progreso ────────────────────────────────────────────── */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-green-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Imágenes ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 md:flex-row">
        <ImagePanel
          imageUrl={imageUrl}
          label="Original"
          differences={differences}
          foundIds={foundIds}
          showHints={showHints}
          onDifferenceClick={handleDifferenceFound}
          onMissClick={() => setMissCount((c) => c + 1)}
        />
        <ImagePanel
          imageUrl={imageUrlAlt}
          label="Modificada"
          differences={differences}
          foundIds={foundIds}
          showHints={showHints}
          onDifferenceClick={handleDifferenceFound}
          onMissClick={() => setMissCount((c) => c + 1)}
        />
      </div>

      {/* ── Chips de diferencias ──────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-1.5 px-4 pb-4">
        {differences.map((d, i) => (
          <span
            key={d.id}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-300',
              foundIds.has(d.id)
                ? 'bg-green-500/25 text-green-300'
                : 'bg-white/8 text-white/40'
            )}
          >
            {foundIds.has(d.id) ? '✓' : i + 1}
          </span>
        ))}
      </div>
    </div>
  )
}
