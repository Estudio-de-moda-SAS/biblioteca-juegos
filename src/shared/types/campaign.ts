import type { GameId, GameSettings } from './game'
import type { Prize } from './prize'

export interface CampaignConfig {
  gameId: GameId
  title: string
  description: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundImage: string
  logo: string
  prizes: Prize[]
  gameSettings: GameSettings
}

export interface WawSettings {
  enabled: boolean
  endpoint: string
  campaignId: string
}

export type CampaignConfigWithWaw = CampaignConfig & { waw?: WawSettings }
