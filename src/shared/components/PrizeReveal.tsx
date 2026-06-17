import { Gift, Trophy } from 'lucide-react'
import type { Prize } from '../types'
import { cn } from '../utils'

interface PrizeRevealProps {
  prize: Prize | null
  revealed: boolean
  onReveal: () => void
}

export function PrizeReveal({ prize, revealed, onReveal }: PrizeRevealProps) {
  if (!revealed) {
    return (
      <button
        onClick={onReveal}
        className="group relative mx-auto flex h-40 w-40 flex-col items-center justify-center rounded-full border-2 border-dashed border-brand-500 bg-brand-500/10 transition-all duration-300 hover:scale-105 hover:bg-brand-500/20"
      >
        <Gift
          size={48}
          className="text-brand-400 transition-transform duration-300 group-hover:scale-110"
        />
        <span className="mt-2 text-xs font-medium text-brand-300">¡Haz clic para revelar!</span>
        <span className="absolute inset-0 animate-ping rounded-full border border-brand-500/30" />
      </button>
    )
  }

  const won = prize !== null && !prize.name.toLowerCase().includes('sin')

  return (
    <div className="animate-bounce-in text-center">
      {won ? (
        <div className="space-y-3">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20 ring-4 ring-yellow-500/30">
            <Trophy size={40} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-400">¡Felicidades! Ganaste:</p>
            <p className="mt-1 text-2xl font-bold text-white">{prize.name}</p>
            {prize.description && (
              <p className="mt-1 text-sm text-gray-400">{prize.description}</p>
            )}
            {prize.code && (
              <div className="mt-3 inline-block rounded-lg bg-white/10 px-4 py-2">
                <p className="text-xs text-gray-400">Tu código de descuento:</p>
                <p className="font-mono text-lg font-bold tracking-widest text-brand-300">
                  {prize.code}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/20">
            <span className="text-4xl">😊</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{prize?.name ?? 'Sin premio esta vez'}</p>
            <p className="mt-1 text-sm text-gray-400">¡Gracias por participar!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function ConfettiEffect({ active }: { active: boolean }) {
  if (!active) return null
  const pieces = Array.from({ length: 20 }, (_, i) => i)
  const colors = ['bg-brand-400', 'bg-yellow-400', 'bg-green-400', 'bg-pink-400', 'bg-blue-400']

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((i) => (
        <div
          key={i}
          className={cn(
            'absolute h-2 w-2 rounded-sm opacity-0',
            colors[i % colors.length],
            'animate-confetti'
          )}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 20 + 10}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${Math.random() * 1 + 1}s`,
          }}
        />
      ))}
    </div>
  )
}
