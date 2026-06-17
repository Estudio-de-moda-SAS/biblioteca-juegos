import type { GameMeta, FindDifferencesSettings } from '@/shared/types'

export const FIND_DIFFERENCES_META: GameMeta = {
  id: 'find-differences',
  name: 'Encuentra las Diferencias',
  description:
    'Observa las dos imágenes y encuentra todas las diferencias entre ellas. ¡Haz clic sobre cada diferencia para marcarla!',
  thumbnail: 'https://picsum.photos/seed/diff-thumb/400/250',
  tags: ['observación', 'concentración', 'agilidad'],
  difficulty: 'easy',
}

export const DEFAULT_FIND_DIFFERENCES_SETTINGS: FindDifferencesSettings = {
  imageUrl: 'https://pilatos21.vteximg.com.br/arquivos/original.png',
  imageUrlAlt: 'https://pilatos21.vteximg.com.br/arquivos/diferencias.png',
  // Coordenadas convertidas de píxeles a % (imagen base ~900x900 px)
  differences: [
    { id: '1', x: 33, y: 28, radius: 8, label: 'Cuadro izquierdo' },
    { id: '2', x: 58, y: 25, radius: 5, label: 'Sol cuadro derecho' },
    { id: '3', x: 16, y: 61, radius: 8, label: 'Cojín sofá' },
    { id: '4', x: 84, y: 84, radius: 7, label: 'Maceta mesa' },
  ],
  showTimer: true,
  timeLimit: null,
  // 0 fallos→premio[0], ≤2→premio[1], ≤3→premio[2], ≤4→premio[3], 5+→premio[4]
  missThresholds: [0, 2, 3, 4],
}

export const FIND_DIFFERENCES_INSTRUCTIONS = [
  'Se muestran dos imágenes similares: original (izquierda) y modificada (derecha).',
  'Busca los detalles que cambiaron entre las dos imágenes.',
  'Haz clic en el lugar exacto donde ves una diferencia en cualquiera de los dos paneles.',
  'Encuentra todas las diferencias para ganar tu premio.',
]
