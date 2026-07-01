/**
 * FindDifferencesVtex — Wrapper listo para VTEX IO.
 *
 * CÓMO USARLO EN VTEX IO:
 * 1. Copia esta carpeta (find-differences/) a tu app de VTEX IO.
 * 2. Ajusta las rutas de importación (@/ → rutas relativas o alias de tu proyecto).
 * 3. Registra el componente en manifest.json y en store/interfaces.json.
 * 4. El Site Editor leerá el schema y mostrará los controles visuales automáticamente.
 */

import type {
  CampaignConfig,
  FindDifferencesSettings,
  DifferenceArea,
  WoowupConfig,
  Prize,
} from '@/shared/types'
import { FindDifferences } from './FindDifferences'
import { DEFAULT_FIND_DIFFERENCES_SETTINGS } from './FindDifferencesConfig'

// ── Premios por defecto ───────────────────────────────────────────────────────
const DEFAULT_PRIZES: Prize[] = [
  { id: '1', name: '40% de descuento', probability: 0, description: 'Sin ningún error', code: 'DIFF40' },
  { id: '2', name: '30% de descuento', probability: 0, description: 'Máximo 2 errores', code: 'DIFF30' },
  { id: '3', name: '20% de descuento', probability: 0, description: 'Máximo 3 errores', code: 'DIFF20' },
  { id: '4', name: 'Envío gratis', probability: 0, description: 'Máximo 4 errores', code: 'DIFFENVIO' },
  { id: '5', name: 'Sin premio', probability: 0, description: 'Demasiados errores — ¡sigue intentando!' },
]

// ── Props del componente VTEX IO ──────────────────────────────────────────────
interface FindDifferencesVtexProps {
  // UI del juego
  title?: string
  description?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  logo?: string
  backgroundImage?: string

  // Configuración del juego
  imageUrl?: string
  imageUrlAlt?: string
  differences?: DifferenceArea[]
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
function FindDifferencesVtex({
  title = 'Encuentra las Diferencias',
  description = 'Encuentra todas las diferencias entre las dos imágenes.',
  primaryColor = '#7c3aed',
  secondaryColor = '#1e1e30',
  accentColor = '#f59e0b',
  logo = '',
  backgroundImage = '',
  imageUrl = DEFAULT_FIND_DIFFERENCES_SETTINGS.imageUrl,
  imageUrlAlt = DEFAULT_FIND_DIFFERENCES_SETTINGS.imageUrlAlt,
  differences = DEFAULT_FIND_DIFFERENCES_SETTINGS.differences,
  showTimer = true,
  timeLimit = null,
  prizes = DEFAULT_PRIZES,
  woowupPublicKey = '',
  woowupTags = 'ecommerce,juego,diferencias',
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
}: FindDifferencesVtexProps) {
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

  const gameSettings: FindDifferencesSettings = {
    imageUrl,
    imageUrlAlt,
    differences,
    showTimer,
    timeLimit,
    missThresholds: DEFAULT_FIND_DIFFERENCES_SETTINGS.missThresholds,
  }

  const config: CampaignConfig = {
    gameId: 'find-differences',
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

  return <FindDifferences config={config} />
}

// ── Schema VTEX IO Site Editor ────────────────────────────────────────────────
;(FindDifferencesVtex as any).schema = {
  title: 'Encuentra las Diferencias',
  description: 'Juego de diferencias para captura de leads en eCommerce.',
  type: 'object',
  properties: {
    // ── UI ──────────────────────────────────────────────────────────────────
    title: { title: 'Título del juego', type: 'string', default: 'Encuentra las Diferencias' },
    description: {
      title: 'Descripción',
      type: 'string',
      default: 'Encuentra todas las diferencias entre las dos imágenes.',
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

    // ── Imágenes y diferencias ───────────────────────────────────────────────
    imageUrl: {
      title: 'Imagen original (URL)',
      type: 'string',
      widget: { 'ui:widget': 'image-uploader' },
    },
    imageUrlAlt: {
      title: 'Imagen modificada (URL)',
      type: 'string',
      widget: { 'ui:widget': 'image-uploader' },
    },
    differences: {
      title: 'Diferencias',
      type: 'array',
      items: {
        type: 'object',
        title: 'Diferencia',
        properties: {
          id: { title: 'ID único', type: 'string' },
          x: { title: 'Posición X (%)', type: 'number' },
          y: { title: 'Posición Y (%)', type: 'number' },
          radius: { title: 'Radio de detección (%)', type: 'number' },
          label: { title: 'Etiqueta (opcional)', type: 'string' },
        },
      },
    },
    showTimer: { title: 'Mostrar temporizador', type: 'boolean', default: true },
    timeLimit: {
      title: 'Límite de tiempo en segundos (0 = sin límite)',
      type: 'number',
      default: 0,
    },

    // ── Premios ──────────────────────────────────────────────────────────────
    prizes: {
      title: 'Premios (mejor → peor, de menos a más errores)',
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
      default: 'ecommerce,juego,diferencias',
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

export default FindDifferencesVtex
