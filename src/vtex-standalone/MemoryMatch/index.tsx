// ============================================================
// MemoryMatch — Componente standalone para VTEX IO
//
// CÓMO USAR EN VTEX IO:
//   1. Copia la carpeta MemoryMatch/ a react/components/ de tu app
//   2. Registra en store/interfaces.json:
//      "memory-match": { "component": "MemoryMatch" }
//   3. En el Site Editor aparecerán todos los controles automáticamente.
//
// Sin dependencias externas. Solo requiere React (>=17).
// ============================================================

import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { LeadForm } from './LeadForm'
import type { Prize, WoowupConfig } from './LeadForm'

// ── Card flip CSS (inyectado una vez) ─────────────────────────
function injectCardCSS() {
  if (typeof document === 'undefined' || document.getElementById('mm-styles')) return
  const el = document.createElement('style')
  el.id = 'mm-styles'
  el.textContent = `
    .mm-card { perspective:600px; -webkit-tap-highlight-color:transparent; cursor:pointer; }
    .mm-card-inner {
      width:100%; height:100%; position:relative;
      transform-style:preserve-3d; transition:transform 0.45s ease;
    }
    .mm-card-inner.mm-up { transform:rotateY(180deg); }
    .mm-face {
      position:absolute; inset:0;
      backface-visibility:hidden; -webkit-backface-visibility:hidden;
      border-radius:10px; overflow:hidden;
    }
    .mm-face-back { transform:rotateY(180deg); }
  `
  document.head.appendChild(el)
}

// ── Types ─────────────────────────────────────────────────────
interface MemoryCardItem { id: string; image: string; alt: string }
interface CardState     { uid: string; pairId: string; image: string; alt: string }
type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type Screen     = 'start' | 'instructions' | 'playing' | 'result'

// ── Grid config ───────────────────────────────────────────────
const GRID: Record<Breakpoint, { cols: number; pairs: number }> = {
  mobile:  { cols: 4, pairs: 8  },
  tablet:  { cols: 5, pairs: 10 },
  desktop: { cols: 4, pairs: 8  },
}

function detectBp(): Breakpoint {
  const w = typeof window !== 'undefined' ? window.innerWidth : 768
  return w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'
}

// ── Default assets ────────────────────────────────────────────
const DEFAULT_CARDS: MemoryCardItem[] = [
  { id: 'c01', image: 'https://picsum.photos/id/26/200/200',  alt: 'Camiseta'  },
  { id: 'c02', image: 'https://picsum.photos/id/42/200/200',  alt: 'Tenis'     },
  { id: 'c03', image: 'https://picsum.photos/id/64/200/200',  alt: 'Gafas'     },
  { id: 'c04', image: 'https://picsum.photos/id/91/200/200',  alt: 'Gorra'     },
  { id: 'c05', image: 'https://picsum.photos/id/103/200/200', alt: 'Reloj'     },
  { id: 'c06', image: 'https://picsum.photos/id/119/200/200', alt: 'Chaqueta'  },
  { id: 'c07', image: 'https://picsum.photos/id/137/200/200', alt: 'Jeans'     },
  { id: 'c08', image: 'https://picsum.photos/id/152/200/200', alt: 'Mochila'   },
  { id: 'c09', image: 'https://picsum.photos/id/163/200/200', alt: 'Cinturón'  },
  { id: 'c10', image: 'https://picsum.photos/id/177/200/200', alt: 'Bufanda'   },
]

const DEFAULT_PRIZES: Prize[] = [
  { id: '1', name: '40% de descuento', code: 'MEMO40',    description: 'Memoria excepcional'    },
  { id: '2', name: '30% de descuento', code: 'MEMO30',    description: 'Menos de 8 errores'     },
  { id: '3', name: '20% de descuento', code: 'MEMO20',    description: 'Menos de 14 errores'    },
  { id: '4', name: 'Envío gratis',     code: 'MEMOENVIO', description: 'Completaste el reto'    },
  { id: '5', name: 'Sin premio',                          description: '¡Sigue intentando!'    },
]

// ── Utilities ─────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function prizeByThreshold(value: number, prizes: Prize[], thresholds: number[]): Prize | null {
  if (!prizes.length) return null
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return prizes[i] ?? null
  }
  return prizes[thresholds.length] ?? prizes[prizes.length - 1] ?? null
}

// ── MemoryCard ─────────────────────────────────────────────────
interface CardProps {
  card: CardState; isFlipped: boolean; isMatched: boolean
  isError: boolean; isDisabled: boolean; primaryColor: string; onClick: () => void
}

const MemoryCard: FC<CardProps> = ({ card, isFlipped, isMatched, isError, isDisabled, primaryColor, onClick }) => {
  const faceUp = isFlipped || isMatched
  return (
    <div
      className="mm-card"
      style={{ aspectRatio: '1 / 1', userSelect: 'none' }}
      onClick={isDisabled || isMatched ? undefined : onClick}
      role="button" tabIndex={0} aria-pressed={faceUp} aria-label={card.alt}
      onKeyDown={e => e.key === 'Enter' && !isDisabled && !isMatched && onClick()}
    >
      <div className={`mm-card-inner${faceUp ? ' mm-up' : ''}`}>
        {/* Facedown */}
        <div className="mm-face" style={{
          background: isError ? 'rgba(239,68,68,0.22)' : `${primaryColor}22`,
          border: `2px solid ${isError ? 'rgba(239,68,68,0.45)' : primaryColor + '44'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>🃏</div>
        {/* Faceup */}
        <div className="mm-face mm-face-back" style={{
          border: isMatched ? '2px solid #4ade80' : isError ? '2px solid #ef4444' : `2px solid ${primaryColor}55`,
          boxShadow: isMatched ? '0 0 10px rgba(74,222,128,0.3)' : 'none',
        }}>
          <img src={card.image} alt={card.alt} style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} draggable={false} />
          {isMatched && (
            <div style={{ position:'absolute', inset:0, background:'rgba(74,222,128,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4ade80', fontSize:18 }}>
              ✓
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Instructions ──────────────────────────────────────────────
const INSTRUCTIONS = [
  'Las cartas están boca abajo. Haz clic en una para voltearla.',
  'Voltea una segunda carta buscando su pareja.',
  'Si coinciden, quedan descubiertas. Si no, vuelven a ocultarse y pierdes una oportunidad.',
  'Encuentra todas las parejas antes de quedarte sin oportunidades para ganar tu premio.',
]

// ── Props ─────────────────────────────────────────────────────
interface MemoryMatchProps {
  title?: string
  description?: string
  primaryColor?: string
  secondaryColor?: string
  logo?: string
  backgroundImage?: string
  cards?: MemoryCardItem[]
  opportunitiesMobile?: number
  opportunitiesTablet?: number
  opportunitiesDesktop?: number
  prizes?: Prize[]
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
  mdEnabled?: boolean
  mdEntity?: string
  mdEmailField?: string
  mdTermsId?: string
  mdUpdatedInId?: string
}

// ── Component ─────────────────────────────────────────────────
function MemoryMatch({
  title                    = 'Memory Match',
  description              = 'Encuentra todas las parejas antes de quedarte sin oportunidades.',
  primaryColor             = '#7c3aed',
  secondaryColor           = '#1e1e30',
  logo,
  backgroundImage,
  cards: cardsProp,
  opportunitiesMobile      = 10,
  opportunitiesTablet      = 20,
  opportunitiesDesktop     = 10,
  prizes: prizesProp,
  woowupPublicKey          = '',
  woowupTags               = 'ecommerce,juego,memoria',
  woowupServiceUidStrategy = 'email',
  woowupTermsId            = 'terms',
  termsText,
  showMarketingOptIn       = false,
  marketingOptInLabel,
  marketingOptInRequired   = false,
  prizeCodeKey             = 'premio_obtenido',
  localStorageKey          = 'game_prize_code',
  mdEnabled                = false,
  mdEntity                 = 'FL',
  mdEmailField             = 'mail',
  mdTermsId                = 'terms',
  mdUpdatedInId,
}: MemoryMatchProps) {
  const allCards = cardsProp ?? DEFAULT_CARDS
  const prizes   = prizesProp ?? DEFAULT_PRIZES
  const woowup: WoowupConfig = {
    publicKey: woowupPublicKey, tags: woowupTags,
    serviceUidStrategy: woowupServiceUidStrategy, termsWoowupId: woowupTermsId,
    termsText, showMarketingOptIn, marketingOptInLabel, marketingOptInRequired,
    sendUpdatedIn: true, updatedInKey: 'updated_in', prizeCodeKey, localStorageKey,
    mdEnabled, mdEntity, mdEmailField, mdTermsId, mdUpdatedInId,
  }
  const oppByBp = { mobile: opportunitiesMobile, tablet: opportunitiesTablet, desktop: opportunitiesDesktop }

  useEffect(() => { injectCardCSS() }, [])

  const [screen, setScreen]               = useState<Screen>('start')
  const [bp, setBp]                       = useState<Breakpoint>('mobile')
  const [cards, setCards]                 = useState<CardState[]>([])
  const [flippedUids, setFlippedUids]     = useState<string[]>([])
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set())
  const [errorUids, setErrorUids]         = useState<string[]>([])
  const [opportunities, setOpportunities] = useState(0)
  const [isLocked, setIsLocked]           = useState(false)
  const [resultWon, setResultWon]         = useState(false)
  const [resultPrize, setResultPrize]     = useState<Prize | null>(null)
  const [resultPairs, setResultPairs]     = useState(0)
  const [resultOppsLeft, setResultOppsLeft] = useState(0)

  const matchedRef   = useRef<Set<string>>(new Set())
  const oppsRef      = useRef(0)
  const totalPairsRef = useRef(0)
  const totalOppsRef  = useRef(0)
  const finishingRef  = useRef(false)

  const initGame = useCallback(() => {
    const breakpoint = detectBp()
    setBp(breakpoint)
    const { pairs } = GRID[breakpoint]
    const opp = oppByBp[breakpoint]
    const count = Math.min(allCards.length, pairs)
    const selected = allCards.slice(0, count)
    const instances: CardState[] = shuffle([
      ...selected.map(c => ({ uid: `${c.id}-0`, pairId: c.id, image: c.image, alt: c.alt })),
      ...selected.map(c => ({ uid: `${c.id}-1`, pairId: c.id, image: c.image, alt: c.alt })),
    ])
    matchedRef.current = new Set()
    oppsRef.current    = opp
    totalPairsRef.current = count
    totalOppsRef.current  = opp
    finishingRef.current  = false
    setCards(instances); setFlippedUids([]); setMatchedPairIds(new Set())
    setErrorUids([]); setOpportunities(opp); setIsLocked(false)
  }, [allCards, opportunitiesMobile, opportunitiesTablet, opportunitiesDesktop]) // eslint-disable-line

  useEffect(() => { if (screen === 'playing') initGame() }, [screen]) // eslint-disable-line

  function finishGame(won: boolean, pairsFound: number, oppsLeft: number) {
    const oppsUsed = totalOppsRef.current - oppsLeft
    const prize = won
      ? prizeByThreshold(oppsUsed, prizes, [3, 7, 13, 20])
      : prizes[prizes.length - 1] ?? null
    setResultWon(won); setResultPrize(prize)
    setResultPairs(pairsFound); setResultOppsLeft(oppsLeft)
    setScreen('result')
  }

  function handleCardClick(uid: string, pairId: string) {
    if (isLocked || matchedRef.current.has(pairId) || flippedUids.includes(uid) || flippedUids.length >= 2) return
    const newFlipped = [...flippedUids, uid]
    setFlippedUids(newFlipped)
    if (newFlipped.length < 2) return
    setIsLocked(true)
    const c1 = cards.find(c => c.uid === newFlipped[0])
    const c2 = cards.find(c => c.uid === newFlipped[1])
    if (c1?.pairId === c2?.pairId) {
      const newMatched = new Set([...matchedRef.current, c1!.pairId])
      matchedRef.current = newMatched
      setMatchedPairIds(newMatched); setFlippedUids([]); setIsLocked(false)
      if (newMatched.size === totalPairsRef.current && !finishingRef.current) {
        finishingRef.current = true
        setTimeout(() => finishGame(true, newMatched.size, oppsRef.current), 600)
      }
    } else {
      setErrorUids(newFlipped)
      const newOpp = oppsRef.current - 1
      oppsRef.current = newOpp; setOpportunities(newOpp)
      setTimeout(() => {
        setFlippedUids([]); setErrorUids([]); setIsLocked(false)
        if (newOpp <= 0 && !finishingRef.current) {
          finishingRef.current = true
          finishGame(false, matchedRef.current.size, 0)
        }
      }, 750)
    }
  }

  // ── Shared start background ───────────────────────────────────
  const startBg: React.CSSProperties = {
    background: backgroundImage
      ? `linear-gradient(to bottom, ${primaryColor}80, ${secondaryColor}dd), url(${backgroundImage}) center/cover`
      : `linear-gradient(135deg, ${primaryColor}33 0%, ${secondaryColor} 100%)`,
    minHeight: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 28, padding: 32, textAlign: 'center',
  }

  // ── Screen: start ─────────────────────────────────────────────
  if (screen === 'start') {
    const visible = prizes.filter(p => !p.name.toLowerCase().includes('sin'))
    return (
      <div style={startBg}>
        {logo
          ? <img src={logo} alt="Logo" style={{ height: 60, objectFit: 'contain' }} />
          : <div style={{ width:76, height:76, borderRadius:16, fontSize:34, background:`${primaryColor}33`, border:`2px solid ${primaryColor}55`, display:'flex', alignItems:'center', justifyContent:'center' }}>🃏</div>
        }
        <div style={{ maxWidth: 340 }}>
          <h1 style={{ color:'white', fontSize:26, fontWeight:700, margin:'0 0 10px' }}>{title}</h1>
          <p  style={{ color:'rgba(255,255,255,0.65)', fontSize:15, margin:0, lineHeight:1.5 }}>{description}</p>
        </div>
        {visible.length > 0 && (
          <div style={{ borderRadius:14, border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.09)', backdropFilter:'blur(8px)', padding:'14px 18px', maxWidth:320, width:'100%' }}>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:2, margin:'0 0 10px', textAlign:'center' }}>Premios disponibles</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center' }}>
              {visible.slice(0, 4).map(p => (
                <span key={p.id} style={{ background:'rgba(255,255,255,0.18)', borderRadius:999, padding:'4px 12px', color:'white', fontSize:12, fontWeight:500 }}>{p.name}</span>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => setScreen('instructions')} style={{ minWidth:176, padding:'13px 24px', background:primaryColor, color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:`0 4px 20px ${primaryColor}55` }}>
          ▶ ¡Jugar ahora!
        </button>
      </div>
    )
  }

  // ── Screen: instructions ──────────────────────────────────────
  if (screen === 'instructions') {
    const curBp = detectBp()
    const { pairs } = GRID[curBp]
    const opp = oppByBp[curBp]
    return (
      <div style={startBg}>
        <div style={{ fontSize:44 }}>🃏</div>
        <div>
          <h2 style={{ color:'white', fontSize:20, fontWeight:700, margin:'0 0 4px', textAlign:'center' }}>¿Cómo jugar?</h2>
          <p  style={{ color:'rgba(255,255,255,0.5)', fontSize:13, margin:0, textAlign:'center' }}>Memory Match — {pairs} parejas · {opp} oportunidades</p>
        </div>
        <ol style={{ listStyle:'none', padding:0, margin:0, maxWidth:320, width:'100%' }}>
          {INSTRUCTIONS.map((step, i) => (
            <li key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
              <span style={{ width:24, height:24, borderRadius:'50%', background:primaryColor, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{i + 1}</span>
              <span style={{ color:'rgba(255,255,255,0.8)', fontSize:14, lineHeight:1.5 }}>{step}</span>
            </li>
          ))}
        </ol>
        <button onClick={() => setScreen('playing')} style={{ padding:'12px 32px', background:primaryColor, color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          ¡Comenzar!
        </button>
      </div>
    )
  }

  // ── Screen: result ────────────────────────────────────────────
  if (screen === 'result') {
    const statsSlot = (
      <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Parejas encontradas', value:`${resultPairs} / ${totalPairsRef.current}`, color:'white' },
          resultWon
            ? { label:'Oportunidades restantes', value:String(resultOppsLeft),            color:'#4ade80' }
            : { label:'Oportunidades usadas',     value:String(totalOppsRef.current),      color:'#f87171' },
        ].map((s, i) => (
          <div key={i} style={{ borderRadius:12, border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.07)', padding:'11px 16px', textAlign:'center' }}>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, margin:'0 0 2px' }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:20, fontWeight:700, margin:0 }}>{s.value}</p>
          </div>
        ))}
      </div>
    )
    return (
      <LeadForm
        won={resultWon} prize={resultPrize} primaryColor={primaryColor}
        woowup={woowup} gameId="memory-match" statsSlot={statsSlot}
        onReset={() => setScreen('start')}
      />
    )
  }

  // ── Screen: playing ───────────────────────────────────────────
  const { cols } = GRID[bp]
  const totalPairs = totalPairsRef.current
  const pairsFound = matchedPairIds.size
  const maxHearts  = Math.min(totalOppsRef.current, 16)

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%', background:`linear-gradient(180deg, ${secondaryColor} 0%, #0f0f1a 100%)` }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', gap:8, background:`${primaryColor}1a`, borderBottom:`1px solid ${primaryColor}33` }}>
        {/* Hearts */}
        <div style={{ display:'flex', alignItems:'center', gap:2, flexWrap:'wrap', maxWidth:'55%' }}>
          {Array.from({ length: maxHearts }, (_, i) => (
            <span key={i} style={{ fontSize:12, opacity: i < opportunities ? 1 : 0.15, transition:'opacity 0.3s' }}>
              {i < opportunities ? '❤️' : '🖤'}
            </span>
          ))}
          {totalOppsRef.current > maxHearts && (
            <span style={{ color:'rgba(255,255,255,0.55)', fontSize:11, marginLeft:2 }}>×{opportunities}</span>
          )}
        </div>
        {/* Pairs + Progress */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'center' }}>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:10, margin:0 }}>Parejas</p>
            <p style={{ color:'white', fontSize:13, fontWeight:700, margin:0 }}>
              {pairsFound}<span style={{ color:'rgba(255,255,255,0.35)' }}> / {totalPairs}</span>
            </p>
          </div>
          <div style={{ width:60, height:6, borderRadius:3, background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:primaryColor, width: totalPairs > 0 ? `${(pairsFound / totalPairs) * 100}%` : '0%', transition:'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:12, overflowY:'auto' }}>
        <div style={{
          display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:8, width:'100%',
          maxWidth: bp === 'mobile' ? 300 : bp === 'tablet' ? 460 : 360,
        }}>
          {cards.map(card => (
            <MemoryCard
              key={card.uid} card={card}
              isFlipped={flippedUids.includes(card.uid)}
              isMatched={matchedPairIds.has(card.pairId)}
              isError={errorUids.includes(card.uid)}
              isDisabled={isLocked && !flippedUids.includes(card.uid)}
              primaryColor={primaryColor}
              onClick={() => handleCardClick(card.uid, card.pairId)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── VTEX IO Site Editor Schema ────────────────────────────────
;(MemoryMatch as any).schema = {
  title: 'Memory Match — Busca la Pareja',
  description: 'Juego de memoria para captura de leads en eCommerce.',
  type: 'object',
  properties: {
    title:           { title: 'Título',                     type: 'string',  default: 'Memory Match' },
    description:     { title: 'Descripción',                type: 'string' },
    primaryColor:    { title: 'Color principal',            type: 'string',  default: '#7c3aed', widget: { 'ui:widget': 'color' } },
    secondaryColor:  { title: 'Color de fondo',             type: 'string',  default: '#1e1e30', widget: { 'ui:widget': 'color' } },
    logo:            { title: 'Logo (URL)',                  type: 'string',  widget: { 'ui:widget': 'image-uploader' } },
    backgroundImage: { title: 'Imagen de fondo (URL)',       type: 'string' },
    opportunitiesMobile:  { title: 'Oportunidades (mobile)',  type: 'number', default: 10 },
    opportunitiesTablet:  { title: 'Oportunidades (tablet)',  type: 'number', default: 20 },
    opportunitiesDesktop: { title: 'Oportunidades (desktop)', type: 'number', default: 10 },
    prizes: {
      title: 'Premios (mejor → peor)', type: 'array',
      items: { type: 'object', title: 'Premio', properties: {
        id:          { title: 'ID único',             type: 'string' },
        name:        { title: 'Nombre del premio',    type: 'string' },
        code:        { title: 'Código de descuento',  type: 'string' },
        description: { title: 'Descripción',          type: 'string' },
      }},
    },
    woowupPublicKey:          { title: 'Woowup — Clave pública *',              type: 'string' },
    woowupTags:               { title: 'Woowup — Tags (coma-separados)',        type: 'string', default: 'ecommerce,juego,memoria' },
    woowupServiceUidStrategy: { title: 'Woowup — service_uid',                 type: 'string', enum: ['none','email'], enumNames: ['Ninguna','Usar email'], default: 'email' },
    woowupTermsId:            { title: 'Woowup — ID campo términos',            type: 'string', default: 'terms' },
    termsText:                { title: 'Texto términos (HTML)',                 type: 'string', widget: { 'ui:widget': 'textarea' } },
    showMarketingOptIn:       { title: 'Mostrar opt-in marketing',              type: 'boolean', default: false },
    marketingOptInLabel:      { title: 'Etiqueta opt-in marketing',             type: 'string' },
    marketingOptInRequired:   { title: '¿Opt-in obligatorio?',                 type: 'boolean', default: false },
    prizeCodeKey:             { title: 'Key código en custom_attributes',       type: 'string', default: 'premio_obtenido' },
    localStorageKey:          { title: 'Clave localStorage',                   type: 'string', default: 'game_prize_code' },
    mdEnabled:                { title: 'Guardar en Master Data (VTEX)',          type: 'boolean', default: false },
    mdEntity:                 { title: 'Entidad Master Data',                   type: 'string', default: 'FL' },
    mdEmailField:             { title: 'Campo email en MD',                     type: 'string', default: 'mail' },
    mdTermsId:                { title: 'Campo términos en MD',                  type: 'string', default: 'terms' },
    mdUpdatedInId:            { title: 'Campo timestamp en MD (opcional)',       type: 'string' },
  },
}

export default MemoryMatch
