import { create } from 'zustand'
import type { CampaignConfig, GameId, Prize, PuzzleSettings, FindDifferencesSettings, MemoryMatchSettings } from '@/shared/types'
import { MEMORY_MATCH_CARDS } from '@/games/memory-match'

const DEFAULT_MEMORY_MATCH_SETTINGS: MemoryMatchSettings = {
  cards: MEMORY_MATCH_CARDS,
  opportunities: { mobile: 10, tablet: 20, desktop: 10 },
  // ≤3 opp.used→prize[0], ≤7→[1], ≤13→[2], ≤20→[3], >20 or lost→[4]
  opportunityThresholds: [3, 7, 13, 20],
}

// Premios de MEJOR a PEOR para Memory Match (por oportunidades usadas)
const MEMORY_MATCH_PRIZES: Prize[] = [
  { id: '1', name: '40% de descuento', probability: 0, description: '¡Memoria perfecta!', code: 'PROMO40' },
  { id: '2', name: '30% de descuento', probability: 0, description: 'Menos de 8 errores', code: 'PROMO30' },
  { id: '3', name: '20% de descuento', probability: 0, description: 'Menos de 14 errores', code: 'PROMO20' },
  { id: '4', name: 'Envío gratis', probability: 0, description: 'Completaste el reto', code: 'ENVIOGRATIS' },
  { id: '5', name: 'Sin premio', probability: 0, description: '¡Inténtalo de nuevo!' },
]

const DEFAULT_PUZZLE_SETTINGS: PuzzleSettings = {
  imageUrl: 'https://picsum.photos/seed/gamestudio/600/600',
  gridSize: 3,
  showTimer: true,
  timeLimit: null,
  // ≤60s→[0], ≤120s→[1], ≤180s→[2], ≤300s→[3], >300s→[4]
  timeThresholds: [60, 120, 180, 300],
}

const DEFAULT_FIND_DIFFERENCES_SETTINGS: FindDifferencesSettings = {
  imageUrl: 'https://pilatos21.vteximg.com.br/arquivos/original.png',
  imageUrlAlt: 'https://pilatos21.vteximg.com.br/arquivos/diferencias.png',
  differences: [
    { id: '1', x: 20, y: 28, radius: 8, label: 'Cuadro izquierdo' },
    { id: '2', x: 35, y: 15, radius: 5, label: 'Sol cuadro derecho' },
    { id: '3', x: 16, y: 61, radius: 8, label: 'Cojín sofá' },
    { id: '4', x: 48, y: 80, radius: 7, label: 'Maceta mesa' },
    { id: '5', x: 65, y: 70, radius: 7, label: 'Maceta esquina' },
  ],
  showTimer: true,
  timeLimit: null,
  // 0 fallos→[0], ≤2→[1], ≤3→[2], ≤4→[3], 5+→[4]
  missThresholds: [0, 2, 3, 4],
}

// Premios ordenados de MEJOR a PEOR para el Puzzle (por tiempo)
const PUZZLE_PRIZES: Prize[] = [
  { id: '1', name: '40% de descuento', probability: 0, description: '¡Menos de 1 minuto!', code: 'PROMO40' },
  { id: '2', name: '30% de descuento', probability: 0, description: 'Menos de 2 minutos', code: 'PROMO30' },
  { id: '3', name: '20% de descuento', probability: 0, description: 'Menos de 3 minutos', code: 'PROMO20' },
  { id: '4', name: 'Envío gratis', probability: 0, description: 'Menos de 5 minutos', code: 'ENVIOGRATIS' },
  { id: '5', name: 'Sin premio', probability: 0, description: '¡Inténtalo más rápido!' },
]

// Premios ordenados de MEJOR a PEOR para Find Differences (por fallos)
const FIND_DIFFERENCES_PRIZES: Prize[] = [
  { id: '1', name: '40% de descuento', probability: 0, description: '¡Sin ningún error!', code: 'PROMO40' },
  { id: '2', name: '20% de descuento', probability: 0, description: 'Máximo 2 errores', code: 'PROMO20' },
  { id: '3', name: '30% de descuento', probability: 0, description: 'Máximo 3 errores', code: 'PROMO30' },
  { id: '4', name: 'Envío gratis', probability: 0, description: 'Máximo 4 errores', code: 'ENVIOGRATIS' },
  { id: '5', name: 'Sin premio', probability: 0, description: 'Demasiados errores — ¡sigue intentando!' },
]

export const DEFAULT_CONFIG: CampaignConfig = {
  gameId: 'puzzle',
  title: 'Campaña Promocional',
  description: '¡Participa y gana increíbles premios!',
  primaryColor: '#7c3aed',
  secondaryColor: '#1e1e30',
  accentColor: '#f59e0b',
  backgroundImage: '',
  logo: '',
  prizes: PUZZLE_PRIZES,
  gameSettings: DEFAULT_PUZZLE_SETTINGS,
}

const GAME_PRIZES: Record<GameId, Prize[]> = {
  puzzle: PUZZLE_PRIZES,
  'find-differences': FIND_DIFFERENCES_PRIZES,
  'memory-match': MEMORY_MATCH_PRIZES,
}

const GAME_SETTINGS = {
  puzzle: DEFAULT_PUZZLE_SETTINGS,
  'find-differences': DEFAULT_FIND_DIFFERENCES_SETTINGS,
  'memory-match': DEFAULT_MEMORY_MATCH_SETTINGS,
}

interface CampaignStore {
  config: CampaignConfig
  previewMode: boolean
  setConfig: (patch: Partial<CampaignConfig>) => void
  setGameId: (gameId: GameId) => void
  setPrizes: (prizes: Prize[]) => void
  setGameSettings: (settings: CampaignConfig['gameSettings']) => void
  togglePreview: () => void
  resetConfig: () => void
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  config: DEFAULT_CONFIG,
  previewMode: false,

  setConfig: (patch) =>
    set((state) => ({ config: { ...state.config, ...patch } })),

  setGameId: (gameId) =>
    set((state) => ({
      config: {
        ...state.config,
        gameId,
        gameSettings: GAME_SETTINGS[gameId],
        prizes: GAME_PRIZES[gameId],
      },
    })),

  setPrizes: (prizes) =>
    set((state) => ({ config: { ...state.config, prizes } })),

  setGameSettings: (settings) =>
    set((state) => ({ config: { ...state.config, gameSettings: settings } })),

  togglePreview: () => set((state) => ({ previewMode: !state.previewMode })),

  resetConfig: () => set({ config: DEFAULT_CONFIG }),
}))
