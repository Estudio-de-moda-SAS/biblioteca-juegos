import { useState } from 'react'
import type { Prize, PrizeResult } from '../types'
import { drawPrize } from '../utils'

export function usePrize(prizes: Prize[]) {
  const [result, setResult] = useState<PrizeResult | null>(null)
  const [revealed, setRevealed] = useState(false)

  const draw = () => {
    const prizeResult = drawPrize(prizes)
    setResult(prizeResult)
    setRevealed(false)
    return prizeResult
  }

  const reveal = () => setRevealed(true)

  const reset = () => {
    setResult(null)
    setRevealed(false)
  }

  return { result, revealed, draw, reveal, reset }
}
