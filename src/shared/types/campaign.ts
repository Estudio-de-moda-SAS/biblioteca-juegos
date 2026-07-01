import type { GameId, GameSettings } from './game'
import type { Prize } from './prize'

export interface WoowupConfig {
  publicKey: string
  tags?: string
  serviceUidStrategy?: 'none' | 'email'
  termsWoowupId?: string
  termsText?: string
  showMarketingOptIn?: boolean
  marketingOptInLabel?: string
  marketingOptInRequired?: boolean
  sendUpdatedIn?: boolean
  updatedInKey?: string
  prizeCodeKey?: string
  localStorageKey?: string
  mdEnabled?: boolean
  mdEntity?: string
  mdEmailField?: string
  mdTermsId?: string
  mdUpdatedInId?: string
}

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
  woowupConfig?: WoowupConfig
}

export interface WawSettings {
  enabled: boolean
  endpoint: string
  campaignId: string
}

export type CampaignConfigWithWaw = CampaignConfig & { waw?: WawSettings }
