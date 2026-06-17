import type { ComponentType } from 'react'
import type { CampaignConfig, GameId, GameMeta, GameResult } from '@/shared/types'
import { Puzzle, PUZZLE_META } from './puzzle'
import { FindDifferences, FIND_DIFFERENCES_META } from './find-differences'
import { MemoryMatch, MEMORY_MATCH_META } from './memory-match'

export interface GameEntry {
  meta: GameMeta
  Component: ComponentType<{ config: CampaignConfig; onComplete?: (result: GameResult) => void }>
}

export const GAME_REGISTRY: Record<GameId, GameEntry> = {
  puzzle: { meta: PUZZLE_META, Component: Puzzle },
  'find-differences': { meta: FIND_DIFFERENCES_META, Component: FindDifferences },
  'memory-match': { meta: MEMORY_MATCH_META, Component: MemoryMatch },
}

export const ALL_GAMES: GameEntry[] = Object.values(GAME_REGISTRY)

export function getGame(id: GameId): GameEntry {
  return GAME_REGISTRY[id]
}
