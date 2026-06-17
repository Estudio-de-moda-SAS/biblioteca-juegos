import type { GameMeta, MemoryCardItem, MemoryMatchSettings } from '@/shared/types'

export const MEMORY_MATCH_META: GameMeta = {
  id: 'memory-match',
  name: 'Memory Match',
  description:
    'Encuentra todas las parejas de cartas antes de quedarte sin oportunidades. ¡Pon a prueba tu memoria!',
  thumbnail: 'https://picsum.photos/seed/memory-match-thumb/400/250',
  tags: ['memoria', 'concentración', 'parejas'],
  difficulty: 'medium',
}

// 18 items — 8 for mobile (4×4), 10 for tablet (5×4), 18 for desktop (6×6)
export const MEMORY_MATCH_CARDS: MemoryCardItem[] = [
  { id: 'shirt',    image: 'https://picsum.photos/seed/mm-shirt/200/200',    alt: 'Camiseta' },
  { id: 'shoes',    image: 'https://picsum.photos/seed/mm-shoes/200/200',    alt: 'Tenis' },
  { id: 'glasses',  image: 'https://picsum.photos/seed/mm-glasses/200/200',  alt: 'Gafas' },
  { id: 'cap',      image: 'https://picsum.photos/seed/mm-cap/200/200',      alt: 'Gorra' },
  { id: 'watch',    image: 'https://picsum.photos/seed/mm-watch/200/200',    alt: 'Reloj' },
  { id: 'jacket',   image: 'https://picsum.photos/seed/mm-jacket/200/200',   alt: 'Chaqueta' },
  { id: 'jeans',    image: 'https://picsum.photos/seed/mm-jeans/200/200',    alt: 'Jeans' },
  { id: 'backpack', image: 'https://picsum.photos/seed/mm-backpack/200/200', alt: 'Mochila' },
  { id: 'belt',     image: 'https://picsum.photos/seed/mm-belt/200/200',     alt: 'Cinturón' },
  { id: 'scarf',    image: 'https://picsum.photos/seed/mm-scarf/200/200',    alt: 'Bufanda' },
  { id: 'boots',    image: 'https://picsum.photos/seed/mm-boots/200/200',    alt: 'Botas' },
  { id: 'bag',      image: 'https://picsum.photos/seed/mm-bag/200/200',      alt: 'Cartera' },
  { id: 'hat',      image: 'https://picsum.photos/seed/mm-hat/200/200',      alt: 'Sombrero' },
  { id: 'tie',      image: 'https://picsum.photos/seed/mm-tie/200/200',      alt: 'Corbata' },
  { id: 'dress',    image: 'https://picsum.photos/seed/mm-dress/200/200',    alt: 'Vestido' },
  { id: 'sandals',  image: 'https://picsum.photos/seed/mm-sandals/200/200',  alt: 'Sandalias' },
  { id: 'sweater',  image: 'https://picsum.photos/seed/mm-sweater/200/200',  alt: 'Suéter' },
  { id: 'bracelet', image: 'https://picsum.photos/seed/mm-bracelet/200/200', alt: 'Pulsera' },
]

export const DEFAULT_MEMORY_MATCH_SETTINGS: MemoryMatchSettings = {
  cards: MEMORY_MATCH_CARDS,
  opportunities: {
    mobile: 10,
    tablet: 20,
    desktop: 10,
  },
  // Thresholds on opportunities USED (lower = better performance)
  // ≤3 used → prize[0] … ≤20 used → prize[3] … >20 → prize[4]
  opportunityThresholds: [3, 7, 13, 20],
}

export const MEMORY_MATCH_INSTRUCTIONS = [
  'Las cartas estarán boca abajo. Haz clic en una para voltearla.',
  'Voltea una segunda carta buscando su pareja.',
  'Si coinciden, la pareja queda descubierta. Si no, vuelven a ocultarse y pierdes una oportunidad.',
  'Encuentra todas las parejas antes de quedarte sin oportunidades para ganar tu premio.',
]
