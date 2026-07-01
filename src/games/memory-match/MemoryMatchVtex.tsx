/**
 * MemoryMatchVtex — Wrapper listo para VTEX IO.
 *
 * CÓMO USARLO EN VTEX IO:
 * 1. Copia esta carpeta (memory-match/) a tu app de VTEX IO.
 * 2. Ajusta las rutas de importación (@/ → rutas relativas o alias de tu proyecto).
 * 3. Registra el componente en manifest.json y en store/interfaces.json.
 * 4. El Site Editor leerá el schema y mostrará los controles visuales automáticamente.
 */

import type { CampaignConfig, MemoryMatchSettings, WoowupConfig, Prize } from '@/shared/types'
import { MemoryMatch } from './MemoryMatch'
import { MEMORY_MATCH_CARDS, DEFAULT_MEMORY_MATCH_SETTINGS } from './MemoryMatchConfig'

// ── Premios por defecto ───────────────────────────────────────────────────────
const DEFAULT_PRIZES: Prize[] = [
  { id: '1', name: '40% de descuento', probability: 0, description: 'Usaste muy pocas oportunidades', code: 'MEMO40' },
  { id: '2', name: '30% de descuento', probability: 0, description: 'Excelente memoria', code: 'MEMO30' },
  { id: '3', name: '20% de descuento', probability: 0, description: 'Buen desempeño', code: 'MEMO20' },
  { id: '4', name: 'Envío gratis', probability: 0, description: 'Completaste el reto', code: 'MEMOENVIO' },
  { id: '5', name: 'Sin premio', probability: 0, description: '¡Sigue intentando!' },
]

// ── Props del componente VTEX IO ──────────────────────────────────────────────
interface MemoryMatchVtexProps {
  // UI del juego
  title?: string
  description?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  logo?: string
  backgroundImage?: string

  // Oportunidades por dispositivo
  opportunitiesMobile?: number
  opportunitiesTablet?: number
  opportunitiesDesktop?: number

  // Premios (configurables desde Site Editor)
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
function MemoryMatchVtex({
  title = 'Memory Match',
  description = 'Encuentra todas las parejas antes de quedarte sin oportunidades.',
  primaryColor = '#7c3aed',
  secondaryColor = '#1e1e30',
  accentColor = '#f59e0b',
  logo = '',
  backgroundImage = '',
  opportunitiesMobile = 10,
  opportunitiesTablet = 20,
  opportunitiesDesktop = 10,
  prizes = DEFAULT_PRIZES,
  woowupPublicKey = '',
  woowupTags = 'ecommerce,juego,memoria',
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
}: MemoryMatchVtexProps) {
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

  const gameSettings: MemoryMatchSettings = {
    cards: MEMORY_MATCH_CARDS,
    opportunities: {
      mobile: opportunitiesMobile,
      tablet: opportunitiesTablet,
      desktop: opportunitiesDesktop,
    },
    opportunityThresholds: DEFAULT_MEMORY_MATCH_SETTINGS.opportunityThresholds,
  }

  const config: CampaignConfig = {
    gameId: 'memory-match',
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

  return <MemoryMatch config={config} />
}

// ── Schema VTEX IO Site Editor ────────────────────────────────────────────────
;(MemoryMatchVtex as any).schema = {
  title: 'Memory Match — Busca la Pareja',
  description: 'Juego de memoria para captura de leads en eCommerce.',
  type: 'object',
  properties: {
    // ── UI ──────────────────────────────────────────────────────────────────
    title: { title: 'Título del juego', type: 'string', default: 'Memory Match' },
    description: {
      title: 'Descripción',
      type: 'string',
      default: 'Encuentra todas las parejas antes de quedarte sin oportunidades.',
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

    // ── Oportunidades ────────────────────────────────────────────────────────
    opportunitiesMobile: {
      title: 'Oportunidades (mobile)',
      type: 'number',
      default: 10,
    },
    opportunitiesTablet: {
      title: 'Oportunidades (tablet)',
      type: 'number',
      default: 20,
    },
    opportunitiesDesktop: {
      title: 'Oportunidades (desktop)',
      type: 'number',
      default: 10,
    },

    // ── Premios ──────────────────────────────────────────────────────────────
    prizes: {
      title: 'Premios (mejor → peor)',
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
    woowupPublicKey: {
      title: 'Woowup — Clave pública *',
      type: 'string',
    },
    woowupTags: {
      title: 'Woowup — Tags (coma-separados)',
      type: 'string',
      default: 'ecommerce,juego,memoria',
    },
    woowupServiceUidStrategy: {
      title: 'Woowup — Estrategia service_uid',
      type: 'string',
      enum: ['none', 'email'],
      enumNames: ['Ninguna', 'Usar email como service_uid'],
      default: 'email',
    },
    woowupTermsId: {
      title: 'Woowup — ID campo términos',
      type: 'string',
      default: 'terms',
    },
    termsText: {
      title: 'Texto de términos (HTML permitido)',
      type: 'string',
      widget: { 'ui:widget': 'textarea' },
    },
    showMarketingOptIn: {
      title: 'Mostrar opt-in de marketing',
      type: 'boolean',
      default: false,
    },
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
    mdEnabled: {
      title: 'Guardar también en Master Data (solo VTEX IO)',
      type: 'boolean',
      default: false,
    },
    mdEntity: {
      title: 'Entidad Master Data (acronym)',
      type: 'string',
      default: 'FL',
    },
    mdEmailField: {
      title: 'Campo email en Master Data',
      type: 'string',
      default: 'mail',
    },
    mdTermsId: {
      title: 'Campo términos en Master Data',
      type: 'string',
      default: 'terms',
    },
    mdUpdatedInId: {
      title: 'Campo timestamp en Master Data (opcional)',
      type: 'string',
    },
  },
}

export default MemoryMatchVtex
