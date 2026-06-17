import type { GameId } from './game'
import type { Prize } from './prize'

export interface WawLeadPayload {
  name: string
  email: string
  phone?: string
  campaignId: string
  campaignTitle: string
  gameId: GameId
  score: number
  timeElapsed: number
  prize: Prize | null
  completedAt: string
  metadata?: Record<string, unknown>
}

export interface WawResponse {
  success: boolean
  leadId?: string
  message?: string
  error?: string
}

export type WawSubmitStatus = 'idle' | 'pending' | 'success' | 'error'
