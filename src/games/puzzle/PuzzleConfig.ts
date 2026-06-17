import type { GameMeta, PuzzleSettings } from '@/shared/types'

export const PUZZLE_META: GameMeta = {
  id: 'puzzle',
  name: 'Puzzle',
  description:
    'Reconstruye la imagen moviendo las piezas a su posición correcta. Cuanto más rápido lo logres, mayor es tu puntuación.',
  thumbnail: 'https://picsum.photos/seed/puzzle-thumb/400/250',
  tags: ['puzzle', 'destreza', 'concentración'],
  difficulty: 'medium',
}

export const DEFAULT_PUZZLE_SETTINGS: PuzzleSettings = {
  imageUrl: 'https://picsum.photos/seed/gamestudio/600/600',
  gridSize: 3,
  showTimer: true,
  timeLimit: null,
  // ≤60s→premio[0], ≤120s→premio[1], ≤180s→premio[2], ≤300s→premio[3], >300s→premio[4]
  timeThresholds: [60, 120, 180, 300],
}

export const PUZZLE_INSTRUCTIONS = [
  'Se mostrará una imagen dividida en piezas revueltas.',
  'Arrastra o haz clic en las piezas para moverlas a la cuadrícula.',
  'Coloca cada pieza en su posición correcta.',
  'Al completar el puzzle ¡descubrirás tu premio!',
]
