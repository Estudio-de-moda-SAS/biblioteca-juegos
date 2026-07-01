import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import type { CampaignConfig, GameResult, MemoryMatchSettings } from '@/shared/types'
import { prizeByThreshold } from '@/shared/utils'
import { GameStartScreen, GameLeadForm } from '@/shared/components'
import { cn } from '@/shared/utils'
import { MemoryCard } from './MemoryCard'
import {
  MEMORY_MATCH_INSTRUCTIONS,
  MEMORY_MATCH_CARDS,
  DEFAULT_MEMORY_MATCH_SETTINGS,
} from './MemoryMatchConfig'

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = 'start' | 'instructions' | 'playing' | 'result'
type Breakpoint = 'mobile' | 'tablet' | 'desktop'

interface CardState {
  uid: string    // e.g. "shirt-0", "shirt-1"
  pairId: string // shared key per pair: "shirt"
  image: string
  alt: string
}

// ─── Grid configuration per breakpoint ───────────────────────────────────────
const GRID_CONFIG: Record<Breakpoint, { cols: number; pairs: number }> = {
  mobile:  { cols: 4, pairs: 8 },
  tablet:  { cols: 5, pairs: 10 },
  desktop: { cols: 4, pairs: 8 },
}

function detectBreakpoint(): Breakpoint {
  const w = typeof window !== 'undefined' ? window.innerWidth : 768
  return w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  config: CampaignConfig
  onComplete?: (result: GameResult) => void
}

// ─── Component ───────────────────────────────────────────────────────────────
export function MemoryMatch({ config, onComplete }: Props) {
  const settings = (config.gameSettings as MemoryMatchSettings) ?? DEFAULT_MEMORY_MATCH_SETTINGS

  // Screen flow
  const [screen, setScreen] = useState<Screen>('start')

  // Game state
  const [bp, setBp] = useState<Breakpoint>('mobile')
  const [cards, setCards] = useState<CardState[]>([])
  const [flippedUids, setFlippedUids] = useState<string[]>([])
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set())
  const [errorUids, setErrorUids] = useState<string[]>([])
  const [opportunities, setOpportunities] = useState(0)
  const [isLocked, setIsLocked] = useState(false)

  // Result state
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [resultPairsFound, setResultPairsFound] = useState(0)
  const [resultOpportunitiesLeft, setResultOpportunitiesLeft] = useState(0)

  // Refs to read current values inside setTimeout without stale closures
  const matchedPairIdsRef = useRef<Set<string>>(new Set())
  const opportunitiesRef = useRef(0)
  const totalPairsRef = useRef(0)
  const totalOpportunitiesRef = useRef(0)
  const isFinishingRef = useRef(false)

  // ── Init ──────────────────────────────────────────────────────────────────
  const initGame = useCallback(() => {
    const breakpoint = detectBreakpoint()
    setBp(breakpoint)

    const allCards = settings.cards ?? MEMORY_MATCH_CARDS
    const { pairs } = GRID_CONFIG[breakpoint]
    const opp = settings.opportunities?.[breakpoint] ?? DEFAULT_MEMORY_MATCH_SETTINGS.opportunities[breakpoint]
    const pairCount = Math.min(allCards.length, pairs)

    const selected = allCards.slice(0, pairCount)
    const instances: CardState[] = shuffleArray([
      ...selected.map((c) => ({ uid: `${c.id}-0`, pairId: c.id, image: c.image, alt: c.alt })),
      ...selected.map((c) => ({ uid: `${c.id}-1`, pairId: c.id, image: c.image, alt: c.alt })),
    ])

    matchedPairIdsRef.current = new Set()
    opportunitiesRef.current = opp
    totalPairsRef.current = pairCount
    totalOpportunitiesRef.current = opp
    isFinishingRef.current = false

    setCards(instances)
    setFlippedUids([])
    setMatchedPairIds(new Set())
    setErrorUids([])
    setOpportunities(opp)
    setIsLocked(false)
    setGameResult(null)
    setResultPairsFound(0)
    setResultOpportunitiesLeft(0)
  }, [settings])

  useEffect(() => {
    if (screen === 'playing') initGame()
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Finish game ───────────────────────────────────────────────────────────
  function finishGame(won: boolean, pairsFound: number, oppsLeft: number) {
    const thresholds = settings.opportunityThresholds ?? DEFAULT_MEMORY_MATCH_SETTINGS.opportunityThresholds
    const oppsUsed = totalOpportunitiesRef.current - oppsLeft

    const prize = won
      ? prizeByThreshold(oppsUsed, config.prizes, thresholds)
      : config.prizes[config.prizes.length - 1] ?? null

    const score = won
      ? pairsFound * 100 + oppsLeft * 10
      : pairsFound * 50

    const result: GameResult = {
      gameId: 'memory-match',
      score,
      timeElapsed: 0,
      completed: won,
      prize,
    }

    setGameResult(result)
    setResultPairsFound(pairsFound)
    setResultOpportunitiesLeft(oppsLeft)
    onComplete?.(result)
    setScreen('result')
  }

  // ── Card click ────────────────────────────────────────────────────────────
  function handleCardClick(uid: string, pairId: string) {
    if (
      isLocked ||
      matchedPairIdsRef.current.has(pairId) ||
      flippedUids.includes(uid) ||
      flippedUids.length >= 2
    ) return

    const newFlipped = [...flippedUids, uid]
    setFlippedUids(newFlipped)

    if (newFlipped.length < 2) return

    // Two cards flipped — evaluate
    setIsLocked(true)

    const c1 = cards.find((c) => c.uid === newFlipped[0])
    const c2 = cards.find((c) => c.uid === newFlipped[1])

    if (c1?.pairId === c2?.pairId) {
      // ✓ Match
      const newMatched = new Set([...matchedPairIdsRef.current, c1!.pairId])
      matchedPairIdsRef.current = newMatched
      setMatchedPairIds(newMatched)
      setFlippedUids([])
      setIsLocked(false)

      if (newMatched.size === totalPairsRef.current && !isFinishingRef.current) {
        isFinishingRef.current = true
        setTimeout(
          () => finishGame(true, newMatched.size, opportunitiesRef.current),
          600
        )
      }
    } else {
      // ✗ No match — consume one opportunity
      setErrorUids(newFlipped)
      const newOpp = opportunitiesRef.current - 1
      opportunitiesRef.current = newOpp
      setOpportunities(newOpp)

      setTimeout(() => {
        setFlippedUids([])
        setErrorUids([])
        setIsLocked(false)

        if (newOpp <= 0 && !isFinishingRef.current) {
          isFinishingRef.current = true
          finishGame(false, matchedPairIdsRef.current.size, 0)
        }
      }, 750)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── Screen: start ────────────────────────────────────────────────────────
  if (screen === 'start') {
    return (
      <GameStartScreen
        config={config}
        icon="🃏"
        onStart={() => setScreen('instructions')}
      />
    )
  }

  // ── Screen: instructions ─────────────────────────────────────────────────
  if (screen === 'instructions') {
    const previewBp = detectBreakpoint()
    const { pairs } = GRID_CONFIG[previewBp]
    const opp = settings.opportunities?.[previewBp] ?? DEFAULT_MEMORY_MATCH_SETTINGS.opportunities[previewBp]

    return (
      <div
        className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${config.primaryColor}33, ${config.secondaryColor})`,
        }}
      >
        <div className="text-5xl">🃏</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">¿Cómo jugar?</h2>
          <p className="text-sm text-white/60">
            Memory Match — {pairs} parejas · {opp} oportunidades
          </p>
        </div>
        <ol className="w-full max-w-xs space-y-3 text-left">
          {MEMORY_MATCH_INSTRUCTIONS.map((step, i) => (
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
          onClick={() => setScreen('playing')}
          className="mt-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-xl transition-transform hover:scale-105"
          style={{ backgroundColor: config.primaryColor }}
        >
          ¡Comenzar!
        </button>
      </div>
    )
  }

  // ── Screen: result ────────────────────────────────────────────────────────
  if (screen === 'result' && gameResult) {
    const won = gameResult.completed
    const statsSlot = (
      <div className="flex justify-center gap-4">
        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-xs text-white/50">Parejas encontradas</p>
          <p className="mt-0.5 text-xl font-bold text-white">
            {resultPairsFound}
            <span className="text-sm font-normal text-white/40"> / {totalPairsRef.current}</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
          {won ? (
            <>
              <p className="text-xs text-white/50">Oportunidades restantes</p>
              <p className="mt-0.5 text-xl font-bold text-green-400">{resultOpportunitiesLeft}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-white/50">Oportunidades utilizadas</p>
              <p className="mt-0.5 text-xl font-bold text-red-400">{totalOpportunitiesRef.current}</p>
            </>
          )}
        </div>
      </div>
    )
    return (
      <GameLeadForm
        config={config}
        result={gameResult}
        statsSlot={statsSlot}
        onReset={() => setScreen('start')}
      />
    )
  }

  // ── Screen: playing ───────────────────────────────────────────────────────
  const { cols } = GRID_CONFIG[bp]
  const totalPairs = totalPairsRef.current
  const pairsFound = matchedPairIds.size

  const gridMaxW =
    bp === 'mobile' ? 'max-w-xs' : bp === 'tablet' ? 'max-w-lg' : 'max-w-2xl'

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: `linear-gradient(180deg, ${config.secondaryColor} 0%, #0f0f1a 100%)` }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 shadow-md"
        style={{
          backgroundColor: config.primaryColor + '22',
          borderBottom: `1px solid ${config.primaryColor}44`,
        }}
      >
        {/* Opportunities */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalOpportunitiesRef.current }).map((_, i) => (
            <Heart
              key={i}
              size={14}
              className={cn(
                'transition-all duration-300',
                i < opportunities
                  ? 'fill-red-500 text-red-500'
                  : 'fill-white/10 text-white/20'
              )}
              aria-hidden="true"
            />
          ))}
          <span className="ml-1 text-xs text-white/60" aria-label={`${opportunities} oportunidades restantes`}>
            {opportunities}
          </span>
        </div>

        {/* Pairs found */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/50">Parejas</span>
          <span className="text-sm font-bold text-white" aria-live="polite">
            {pairsFound}
            <span className="text-white/40"> / {totalPairs}</span>
          </span>
        </div>

        {/* Progress bar placeholder */}
        <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: totalPairs > 0 ? `${(pairsFound / totalPairs) * 100}%` : '0%',
              backgroundColor: config.primaryColor,
            }}
            role="progressbar"
            aria-valuenow={pairsFound}
            aria-valuemin={0}
            aria-valuemax={totalPairs}
          />
        </div>
      </div>

      {/* ── Card grid ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 items-center justify-center overflow-y-auto p-3 sm:p-4 lg:p-6"
        aria-label="Tablero de juego Memory Match"
      >
        <div
          className={cn('grid w-full gap-1.5 sm:gap-2 mx-auto', gridMaxW)}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          role="grid"
          aria-label={`Grid de ${cols} columnas`}
        >
          {cards.map((card) => (
            <MemoryCard
              key={card.uid}
              uid={card.uid}
              image={card.image}
              alt={card.alt}
              isFlipped={flippedUids.includes(card.uid)}
              isMatched={matchedPairIds.has(card.pairId)}
              isError={errorUids.includes(card.uid)}
              isDisabled={isLocked && !flippedUids.includes(card.uid)}
              primaryColor={config.primaryColor}
              onClick={() => handleCardClick(card.uid, card.pairId)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
