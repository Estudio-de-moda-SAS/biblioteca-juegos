import type { Prize } from './prize'

export type GameId = 'puzzle' | 'find-differences' | 'memory-match'

export type GameScreen = 'start' | 'instructions' | 'playing' | 'result'

export interface GameMeta {
  id: GameId
  name: string
  description: string
  thumbnail: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface GameResult {
  gameId: GameId
  score: number
  timeElapsed: number
  completed: boolean
  prize: Prize | null
}

export interface PuzzleSettings {
  imageUrl: string
  gridSize: 3 | 4 | 5
  showTimer: boolean
  timeLimit: number | null
  // Premio por tiempo: prizes[i] si time ≤ timeThresholds[i], último premio si supera todos
  timeThresholds: number[]
}

export interface DifferenceArea {
  id: string
  x: number     // posición horizontal en % (0-100) sobre la imagen
  y: number     // posición vertical en % (0-100) sobre la imagen
  radius: number  // radio de detección del clic en % del ancho de imagen
  label?: string
}

export interface FindDifferencesSettings {
  imageUrl: string
  imageUrlAlt: string
  differences: DifferenceArea[]
  showTimer: boolean
  timeLimit: number | null
  // Premio por fallos: prizes[i] si missCount ≤ missThresholds[i], último si supera todos
  missThresholds: number[]
}

export interface MemoryCardItem {
  id: string
  image: string
  alt: string
}

export interface MemoryMatchSettings {
  cards: MemoryCardItem[]
  opportunities: {
    mobile: number
    tablet: number
    desktop: number
  }
  // Thresholds for opportunities USED (smaller = better match)
  // prizes[0] if used ≤ thresholds[0], prizes[1] if ≤ thresholds[1], …, prizes[last] fallback
  opportunityThresholds: number[]
}

export type GameSettings = PuzzleSettings | FindDifferencesSettings | MemoryMatchSettings
