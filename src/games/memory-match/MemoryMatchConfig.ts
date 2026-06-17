import type { GameMeta, MemoryCardItem, MemoryMatchSettings } from '@/shared/types'

export const MEMORY_MATCH_META: GameMeta = {
  id: 'memory-match',
  name: 'Memory Match',
  description:
    'Encuentra todas las parejas de cartas antes de quedarte sin oportunidades. ¡Pon a prueba tu memoria!',
  thumbnail: 'https://picsum.photos/id/26/400/250',
  tags: ['memoria', 'concentración', 'parejas'],
  difficulty: 'medium',
}

// 18 items — 8 for mobile (4×4), 10 for tablet (5×4), 18 for desktop (4×4)
// Uses stable picsum /id/ URLs (seed-based URLs return intermittent 404 via Cloudflare CDN)
export const MEMORY_MATCH_CARDS: MemoryCardItem[] = [
  { id: 'shirt',    image: 'https://picsum.photos/id/26/200/200',  alt: 'Camiseta' },
  { id: 'shoes',    image: 'https://picsum.photos/id/42/200/200',  alt: 'Tenis' },
  { id: 'glasses',  image: 'https://picsum.photos/id/64/200/200',  alt: 'Gafas' },
  { id: 'cap',      image: 'https://picsum.photos/id/91/200/200',  alt: 'Gorra' },
  { id: 'watch',    image: 'https://picsum.photos/id/103/200/200', alt: 'Reloj' },
  { id: 'jacket',   image: 'https://picsum.photos/id/119/200/200', alt: 'Chaqueta' },
  { id: 'jeans',    image: 'https://picsum.photos/id/137/200/200', alt: 'Jeans' },
  { id: 'backpack', image: 'https://picsum.photos/id/152/200/200', alt: 'Mochila' },
  { id: 'belt',     image: 'https://picsum.photos/id/163/200/200', alt: 'Cinturón' },
  { id: 'scarf',    image: 'https://picsum.photos/id/177/200/200', alt: 'Bufanda' },
  { id: 'boots',    image: 'https://picsum.photos/id/193/200/200', alt: 'Botas' },
  { id: 'bag',      image: 'https://picsum.photos/id/210/200/200', alt: 'Cartera' },
  { id: 'hat',      image: 'https://picsum.photos/id/225/200/200', alt: 'Sombrero' },
  { id: 'tie',      image: 'https://picsum.photos/id/239/200/200', alt: 'Corbata' },
  { id: 'dress',    image: 'https://picsum.photos/id/247/200/200', alt: 'Vestido' },
  { id: 'sandals',  image: 'https://picsum.photos/id/256/200/200', alt: 'Sandalias' },
  { id: 'sweater',  image: 'https://picsum.photos/id/273/200/200', alt: 'Suéter' },
  { id: 'bracelet', image: 'https://picsum.photos/id/287/200/200', alt: 'Pulsera' },
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
