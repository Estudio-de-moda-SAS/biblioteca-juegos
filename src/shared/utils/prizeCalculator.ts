import type { Prize, PrizeResult } from '../types'

export function drawPrize(prizes: Prize[]): PrizeResult {
  if (!prizes.length) return { prize: null, won: false }

  const totalWeight = prizes.reduce((sum, p) => sum + p.probability, 0)
  if (totalWeight <= 0) return { prize: null, won: false }

  const roll = Math.random() * totalWeight
  let accumulated = 0

  for (const prize of prizes) {
    accumulated += prize.probability
    if (roll < accumulated) {
      return { prize, won: true }
    }
  }

  return { prize: prizes[prizes.length - 1], won: true }
}

export function normalizeProbabilities(prizes: Prize[]): Prize[] {
  const total = prizes.reduce((sum, p) => sum + p.probability, 0)
  if (total === 0) return prizes
  return prizes.map((p) => ({ ...p, probability: Math.round((p.probability / total) * 100) }))
}

export function validateProbabilities(prizes: Prize[]): boolean {
  const total = prizes.reduce((sum, p) => sum + p.probability, 0)
  return Math.abs(total - 100) < 0.01
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Selecciona un premio determinístico basado en un valor numérico y umbrales.
 * prizes[i] se otorga si value <= thresholds[i].
 * El último prize es el fallback (sin umbral, se otorga si supera todos).
 * thresholds.length debe ser prizes.length - 1.
 */
export function prizeByThreshold(
  value: number,
  prizes: Prize[],
  thresholds: number[]
): Prize | null {
  if (!prizes.length) return null
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return prizes[i] ?? null
  }
  return prizes[thresholds.length] ?? prizes[prizes.length - 1] ?? null
}

export function scoreFromTime(timeElapsed: number, timeLimit: number | null): number {
  if (timeLimit === null) return 1000
  const remaining = Math.max(0, timeLimit - timeElapsed)
  return Math.round((remaining / timeLimit) * 1000)
}
