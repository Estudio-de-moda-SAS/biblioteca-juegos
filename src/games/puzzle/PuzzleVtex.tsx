/**
 * PuzzleVtex — Wrapper listo para VTEX IO.
 *
 * CÓMO USARLO EN VTEX IO:
 * 1. Copia esta carpeta (puzzle/) a tu app de VTEX IO.
 * 2. Ajusta las rutas de importación (@/ → rutas relativas o alias de tu proyecto).
 * 3. Registra el componente en manifest.json y en store/interfaces.json.
 * 4. El Site Editor leerá el schema y mostrará los controles visuales automáticamente.
 */

import type { CampaignConfig, PuzzleSettings, WoowupConfig, Prize } from '@/shared/types'
import { Puzzle } from './Puzzle'

// ── Premios por defecto ───────────────────────────────────────────────────────
const DEFAULT_PRIZES: Prize[] = [
  { id: '1', name: '40% de descuento', probability: 0, description: 'Menos de 1 minuto', code: 'PUZ40' },
  { id: '2', name: '30% de descuento', probability: 0, description: 'Menos de 2 minutos', code: 'PUZ30' },
  { id: '3', name: '20% de descuento', probability: 0, description: 'Menos de 3 minutos', code: 'PUZ20' },
  { id: '4', name: 'Envío gratis', probability: 0, description: 'Menos de 5 minutos', code: 'PUZENVIO' },
  { id: '5', name: 'Sin premio', probability: 0, description: '¡Inténtalo más rápido!' },
]

// ── Props del componente VTEX IO ──────────────────────────────────────────────
interface PuzzleVtexProps {
  // UI del juego
  title?: string
  description?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  logo?: string
  backgroundImage?: string

  // Configuración del puzzle
  imageUrl?: string
  gridSize?: 3 | 4 | 5
  showTimer?: boolean
  timeLimit?: number | null

  // Premios
  prizes?: Prize[]

  // Woowup
  woowupPublicKey?: string
  woowupTags?: string
  woowupServiceUidStrategy?: 'none' | 'email'
  woowupTermsId?: string
  termsText?: string
  showMarketingOptIn?: boolean
  marketingOptInLabel?: string
  marketingOptInRequired?: boolean
  prizeCodeKey?: string
  localStorageKey?: string

  // Master Data (VTEX)
  mdEnabled?: boolean
  mdEntity?: string
  mdEmailField?: string
  mdTermsId?: string
  mdUpdatedInId?: string
}

// ── Componente ────────────────────────────────────────────────────────────────
function PuzzleVtex({
  title = 'Puzzle',
  description = 'Reconstruye la imagen moviendo las piezas a su posición correcta.',
  primaryColor = '#7c3aed',
  secondaryColor = '#1e1e30',
  accentColor = '#f59e0b',
  logo = '',
  backgroundImage = '',
  imageUrl = 'https://picsum.photos/seed/gamestudio/600/600',
  gridSize = 3,
  showTimer = true,
  timeLimit = null,
  prizes = DEFAULT_PRIZES,
  woowupPublicKey = '',
  woowupTags = 'ecommerce,juego,puzzle',
  woowupServiceUidStrategy = 'email',
  woowupTermsId = 'terms',
  termsText,
  showMarketingOptIn = false,
  marketingOptInLabel = 'Acepto recibir comunicaciones de marketing (Email y SMS)',
  marketingOptInRequired = false,
  prizeCodeKey = 'premio_obtenido',
  localStorageKey = 'game_prize_code',
  mdEnabled = false,
  mdEntity = 'FL',
  mdEmailField = 'mail',
  mdTermsId = 'terms',
  mdUpdatedInId,
}: PuzzleVtexProps) {
  const woowupConfig: WoowupConfig = {
    publicKey: woowupPublicKey,
    tags: woowupTags,
    serviceUidStrategy: woowupServiceUidStrategy,
    termsWoowupId: woowupTermsId,
    termsText,
    showMarketingOptIn,
    marketingOptInLabel,
    marketingOptInRequired,
    sendUpdatedIn: true,
    updatedInKey: 'updated_in',
    prizeCodeKey,
    localStorageKey,
    mdEnabled,
    mdEntity,
    mdEmailField,
    mdTermsId,
    mdUpdatedInId,
  }

  const gameSettings: PuzzleSettings = {
    imageUrl,
    gridSize,
    showTimer,
    timeLimit,
    timeThresholds: [60, 120, 180, 300],
  }

  const config: CampaignConfig = {
    gameId: 'puzzle',
    title,
    description,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundImage,
    logo,
    prizes,
    gameSettings,
    woowupConfig,
  }

  return <Puzzle config={config} />
}

// ── Schema VTEX IO Site Editor ────────────────────────────────────────────────
;(PuzzleVtex as any).schema = {
  title: 'Puzzle — Arma la Imagen',
  description: 'Juego de puzzle para captura de leads en eCommerce.',
  type: 'object',
  properties: {
    // ── UI ──────────────────────────────────────────────────────────────────
    title: { title: 'Título del juego', type: 'string', default: 'Puzzle' },
    description: {
      title: 'Descripción',
      type: 'string',
      default: 'Reconstruye la imagen moviendo las piezas a su posición correcta.',
    },
    primaryColor: {
      title: 'Color principal',
      type: 'string',
      default: '#7c3aed',
      widget: { 'ui:widget': 'color' },
    },
    secondaryColor: {
      title: 'Color secundario / fondo',
      type: 'string',
      default: '#1e1e30',
      widget: { 'ui:widget': 'color' },
    },
    accentColor: {
      title: 'Color de acento',
      type: 'string',
      default: '#f59e0b',
      widget: { 'ui:widget': 'color' },
    },
    logo: {
      title: 'Logo (URL)',
      type: 'string',
      widget: { 'ui:widget': 'image-uploader' },
    },
    backgroundImage: { title: 'Imagen de fondo (URL)', type: 'string' },

    // ── Configuración del puzzle ─────────────────────────────────────────────
    imageUrl: {
      title: 'Imagen del puzzle (URL)',
      type: 'string',
      widget: { 'ui:widget': 'image-uploader' },
      default: 'https://picsum.photos/seed/gamestudio/600/600',
    },
    gridSize: {
      title: 'Tamaño de la cuadrícula',
      type: 'number',
      enum: [3, 4, 5],
      enumNames: ['3×3 (9 piezas)', '4×4 (16 piezas)', '5×5 (25 piezas)'],
      default: 3,
    },
    showTimer: {
      title: 'Mostrar temporizador',
      type: 'boolean',
      default: true,
    },
    timeLimit: {
      title: 'Límite de tiempo en segundos (0 = sin límite)',
      type: 'number',
      default: 0,
    },

    // ── Premios ──────────────────────────────────────────────────────────────
    prizes: {
      title: 'Premios (mejor → peor, de más rápido a más lento)',
      type: 'array',
      items: {
        type: 'object',
        title: 'Premio',
        properties: {
          id: { title: 'ID único', type: 'string' },
          name: { title: 'Nombre del premio', type: 'string' },
          code: { title: 'Código de descuento', type: 'string' },
          description: { title: 'Descripción', type: 'string' },
        },
      },
    },

    // ── Woowup ───────────────────────────────────────────────────────────────
    woowupPublicKey: { title: 'Woowup — Clave pública *', type: 'string' },
    woowupTags: {
      title: 'Woowup — Tags (coma-separados)',
      type: 'string',
      default: 'ecommerce,juego,puzzle',
    },
    woowupServiceUidStrategy: {
      title: 'Woowup — Estrategia service_uid',
      type: 'string',
      enum: ['none', 'email'],
      enumNames: ['Ninguna', 'Usar email como service_uid'],
      default: 'email',
    },
    woowupTermsId: { title: 'Woowup — ID campo términos', type: 'string', default: 'terms' },
    termsText: {
      title: 'Texto de términos (HTML permitido)',
      type: 'string',
      widget: { 'ui:widget': 'textarea' },
    },
    showMarketingOptIn: { title: 'Mostrar opt-in de marketing', type: 'boolean', default: false },
    marketingOptInLabel: {
      title: 'Etiqueta del opt-in de marketing',
      type: 'string',
      default: 'Acepto recibir comunicaciones de marketing (Email y SMS)',
    },
    marketingOptInRequired: {
      title: '¿Hacer obligatorio el opt-in?',
      type: 'boolean',
      default: false,
    },
    prizeCodeKey: {
      title: 'Key del código en custom_attributes de Woowup',
      type: 'string',
      default: 'premio_obtenido',
    },
    localStorageKey: {
      title: 'Clave en localStorage para el código del premio',
      type: 'string',
      default: 'game_prize_code',
    },

    // ── Master Data (solo VTEX) ──────────────────────────────────────────────
    mdEnabled: { title: 'Guardar también en Master Data (solo VTEX IO)', type: 'boolean', default: false },
    mdEntity: { title: 'Entidad Master Data (acronym)', type: 'string', default: 'FL' },
    mdEmailField: { title: 'Campo email en Master Data', type: 'string', default: 'mail' },
    mdTermsId: { title: 'Campo términos en Master Data', type: 'string', default: 'terms' },
    mdUpdatedInId: { title: 'Campo timestamp en Master Data (opcional)', type: 'string' },
  },
}

export default PuzzleVtex
