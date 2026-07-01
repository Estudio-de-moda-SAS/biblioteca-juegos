// ============================================================
// Puzzle — Componente standalone para VTEX IO
//
// CÓMO USAR EN VTEX IO:
//   1. Copia la carpeta Puzzle/ a react/components/ de tu app
//   2. Registra en store/interfaces.json:
//      "puzzle": { "component": "Puzzle" }
//   3. En el Site Editor aparecerán todos los controles automáticamente.
//
// Sin dependencias externas. Solo requiere React (>=17).
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LeadForm } from './LeadForm'
import type { Prize, WoowupConfig } from './LeadForm'

// ── Types ─────────────────────────────────────────────────────
interface PuzzlePiece { id: number; correctRow: number; correctCol: number }
type Screen = 'start' | 'instructions' | 'playing' | 'result'

// ── Utilities ─────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatTime(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function prizeByThreshold(value: number, prizes: Prize[], thresholds: number[]): Prize | null {
  if (!prizes.length) return null
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return prizes[i] ?? null
  }
  return prizes[thresholds.length] ?? prizes[prizes.length - 1] ?? null
}

function getPieceStyle(piece: PuzzlePiece, gridSize: number, imageUrl: string, size: number): React.CSSProperties {
  const bgSize   = gridSize * size
  const xPercent = gridSize === 1 ? 0 : (piece.correctCol / (gridSize - 1)) * 100
  const yPercent = gridSize === 1 ? 0 : (piece.correctRow / (gridSize - 1)) * 100
  return {
    backgroundImage:    `url(${imageUrl})`,
    backgroundSize:     `${bgSize}px ${bgSize}px`,
    backgroundPosition: `${xPercent}% ${yPercent}%`,
    width: size, height: size,
  }
}

// ── Default prizes ────────────────────────────────────────────
const DEFAULT_PRIZES: Prize[] = [
  { id: '1', name: '40% de descuento', code: 'PUZ40',    description: '¡Menos de 1 minuto!'   },
  { id: '2', name: '30% de descuento', code: 'PUZ30',    description: 'Menos de 2 minutos'    },
  { id: '3', name: '20% de descuento', code: 'PUZ20',    description: 'Menos de 3 minutos'    },
  { id: '4', name: 'Envío gratis',     code: 'PUZENVIO', description: 'Menos de 5 minutos'    },
  { id: '5', name: 'Sin premio',                         description: '¡Inténtalo más rápido!'},
]

// ── Instructions ──────────────────────────────────────────────
const INSTRUCTIONS = [
  'Se mezclarán las piezas de la imagen. Tu objetivo es reconstruirla.',
  'Haz clic en una pieza del banco para seleccionarla (se resaltará).',
  'Luego haz clic en la celda del tablero donde quieres colocarla.',
  'También puedes arrastrar las piezas. ¡Completa el puzzle lo más rápido posible!',
]

// ── Props ─────────────────────────────────────────────────────
interface PuzzleProps {
  title?: string
  description?: string
  primaryColor?: string
  secondaryColor?: string
  logo?: string
  backgroundImage?: string
  imageUrl?: string
  gridSize?: 3 | 4 | 5
  showTimer?: boolean
  timeLimit?: number | null
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
function Puzzle({
  title                    = 'Puzzle',
  description              = 'Reconstruye la imagen moviendo las piezas a su posición correcta.',
  primaryColor             = '#7c3aed',
  secondaryColor           = '#1e1e30',
  logo,
  backgroundImage,
  imageUrl                 = 'https://picsum.photos/seed/gamestudio/600/600',
  gridSize                 = 3,
  showTimer                = true,
  timeLimit                = null,
  prizes: prizesProp,
  woowupPublicKey          = '',
  woowupTags               = 'ecommerce,juego,puzzle',
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
}: PuzzleProps) {
  const prizes = prizesProp ?? DEFAULT_PRIZES
  const woowup: WoowupConfig = {
    publicKey: woowupPublicKey, tags: woowupTags,
    serviceUidStrategy: woowupServiceUidStrategy, termsWoowupId: woowupTermsId,
    termsText, showMarketingOptIn, marketingOptInLabel, marketingOptInRequired,
    sendUpdatedIn: true, updatedInKey: 'updated_in', prizeCodeKey, localStorageKey,
    mdEnabled, mdEntity, mdEmailField, mdTermsId, mdUpdatedInId,
  }

  const totalPieces = gridSize * gridSize

  const [screen,       setScreen]       = useState<Screen>('start')
  const [tray,         setTray]         = useState<PuzzlePiece[]>([])
  const [board,        setBoard]        = useState<(PuzzlePiece | null)[][]>([])
  const [selected,     setSelected]     = useState<{ piece: PuzzlePiece; from: 'tray' | 'board'; boardPos?: [number, number] } | null>(null)
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set())
  const [completed,    setCompleted]    = useState(false)
  const [time,         setTime]         = useState(0)
  const [resultTime,   setResultTime]   = useState(0)
  const [resultScore,  setResultScore]  = useState(0)
  const [resultPrize,  setResultPrize]  = useState<Prize | null>(null)
  const [resultWon,    setResultWon]    = useState(false)

  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerStarted = useRef(false)
  const dragRef      = useRef<{ piece: PuzzlePiece; from: 'tray' | 'board'; boardPos?: [number, number] } | null>(null)
  const completedRef = useRef(false)

  function startTimer() {
    if (timerStarted.current) return
    timerStarted.current = true
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000)
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function resetTimer() {
    stopTimer(); timerStarted.current = false; setTime(0)
  }

  useEffect(() => () => stopTimer(), [])

  // Time limit watcher
  useEffect(() => {
    if (timeLimit && time >= timeLimit && screen === 'playing' && !completedRef.current) {
      completedRef.current = true
      handleFinish(false, time)
    }
  }, [time]) // eslint-disable-line

  const pieces: PuzzlePiece[] = useMemo(
    () => Array.from({ length: totalPieces }, (_, i) => ({
      id: i, correctRow: Math.floor(i / gridSize), correctCol: i % gridSize,
    })),
    [totalPieces, gridSize]
  )

  const initGame = useCallback(() => {
    setTray(shuffle(pieces))
    setBoard(Array.from({ length: gridSize }, () => Array(gridSize).fill(null)))
    setSelected(null); setCorrectCells(new Set()); setCompleted(false)
    completedRef.current = false
    resetTimer()
  }, [pieces, gridSize]) // eslint-disable-line

  useEffect(() => { if (screen === 'playing') initGame() }, [screen]) // eslint-disable-line

  function checkCompletion(newBoard: (PuzzlePiece | null)[][]): boolean {
    const newCorrect = new Set<string>()
    let allCorrect = true
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const p = newBoard[r][c]
        if (p && p.correctRow === r && p.correctCol === c) newCorrect.add(`${r}-${c}`)
        else allCorrect = false
      }
    }
    setCorrectCells(newCorrect)
    return allCorrect
  }

  function handleFinish(success: boolean, finalTime: number) {
    stopTimer(); setCompleted(success)
    const prize = prizeByThreshold(finalTime, prizes, [60, 120, 180, 300])
    const score = success ? Math.max(0, 1000 - finalTime * 5) : 0
    setResultTime(finalTime); setResultScore(score); setResultPrize(prize); setResultWon(success)
    setScreen('result')
  }

  function placePiece(
    targetRow: number, targetCol: number,
    source: { piece: PuzzlePiece; from: 'tray' | 'board'; boardPos?: [number, number] }
  ) {
    const newBoard = board.map(row => [...row])
    const existing = newBoard[targetRow][targetCol]
    if (source.from === 'tray') {
      newBoard[targetRow][targetCol] = source.piece
      setTray(prev => prev.filter(p => p.id !== source.piece.id))
      if (existing) setTray(prev => [...prev, existing])
    } else if (source.boardPos) {
      const [sr, sc] = source.boardPos
      newBoard[targetRow][targetCol] = source.piece
      newBoard[sr][sc] = existing
    }
    setBoard(newBoard); setSelected(null)
    const allCorrect = checkCompletion(newBoard)
    if (allCorrect && !completedRef.current) {
      completedRef.current = true
      handleFinish(true, time)
    }
  }

  function handleCellClick(row: number, col: number) {
    if (selected) { placePiece(row, col, selected); return }
    const cellPiece = board[row]?.[col]
    if (cellPiece) setSelected({ piece: cellPiece, from: 'board', boardPos: [row, col] })
  }

  function handleTrayClick(piece: PuzzlePiece) {
    if (selected?.piece.id === piece.id && selected.from === 'tray') { setSelected(null); return }
    setSelected({ piece, from: 'tray' })
  }

  const pieceSize = Math.min(Math.floor(280 / gridSize), 100)
  const placed    = board.flat().filter(Boolean).length

  // ── Shared backgrounds ────────────────────────────────────────
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
          ? <img src={logo} alt="Logo" style={{ height:60, objectFit:'contain' }} />
          : <div style={{ width:76, height:76, borderRadius:16, fontSize:34, background:`${primaryColor}33`, border:`2px solid ${primaryColor}55`, display:'flex', alignItems:'center', justifyContent:'center' }}>🧩</div>
        }
        <div style={{ maxWidth:340 }}>
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
    return (
      <div style={startBg}>
        <div style={{ fontSize:44 }}>🧩</div>
        <div>
          <h2 style={{ color:'white', fontSize:20, fontWeight:700, margin:'0 0 4px', textAlign:'center' }}>¿Cómo jugar?</h2>
          <p  style={{ color:'rgba(255,255,255,0.5)', fontSize:13, margin:0, textAlign:'center' }}>
            Puzzle — {gridSize}×{gridSize} · {totalPieces} piezas{timeLimit ? ` · ${formatTime(timeLimit)} límite` : ''}
          </p>
        </div>
        <ol style={{ listStyle:'none', padding:0, margin:0, maxWidth:320, width:'100%' }}>
          {INSTRUCTIONS.map((step, i) => (
            <li key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
              <span style={{ width:24, height:24, borderRadius:'50%', background:primaryColor, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{i + 1}</span>
              <span style={{ color:'rgba(255,255,255,0.8)', fontSize:14, lineHeight:1.5 }}>{step}</span>
            </li>
          ))}
        </ol>
        <button onClick={() => { setScreen('playing'); startTimer() }} style={{ padding:'12px 32px', background:primaryColor, color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          ¡Comenzar!
        </button>
      </div>
    )
  }

  // ── Screen: result ────────────────────────────────────────────
  if (screen === 'result') {
    const statsSlot = (
      <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
        {showTimer && (
          <div style={{ borderRadius:12, border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.07)', padding:'11px 16px', textAlign:'center' }}>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, margin:'0 0 2px' }}>Tiempo</p>
            <p style={{ color:'white', fontSize:20, fontWeight:700, margin:0, fontFamily:'monospace' }}>{formatTime(resultTime)}</p>
          </div>
        )}
        <div style={{ borderRadius:12, border:'1px solid rgba(255,255,255,0.18)', background:'rgba(255,255,255,0.07)', padding:'11px 16px', textAlign:'center' }}>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11, margin:'0 0 2px' }}>Puntuación</p>
          <p style={{ color:'white', fontSize:20, fontWeight:700, margin:0 }}>{resultScore}</p>
        </div>
      </div>
    )
    return (
      <LeadForm
        won={resultWon} prize={resultPrize} primaryColor={primaryColor}
        woowup={woowup} gameId="puzzle" statsSlot={statsSlot}
        onReset={() => setScreen('start')}
      />
    )
  }

  // ── Screen: playing ───────────────────────────────────────────
  const timePct    = (timeLimit && timeLimit > 0) ? time / timeLimit : null
  const timeWarn   = timePct !== null && timePct >= 0.75

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%', background:`linear-gradient(180deg, ${secondaryColor} 0%, #0f0f1a 100%)` }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:`${primaryColor}1a`, borderBottom:`1px solid ${primaryColor}33` }}>
        <span style={{ color:'rgba(255,255,255,0.65)', fontSize:13 }}>🧩 {placed}/{totalPieces} piezas</span>
        {showTimer && (
          <span style={{ color: timeWarn ? '#f87171' : 'white', fontSize:14, fontWeight:700, fontFamily:'monospace' }}>
            ⏱ {formatTime(time)}{timeLimit ? ` / ${formatTime(timeLimit)}` : ''}
          </span>
        )}
        <button onClick={initGame} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'rgba(255,255,255,0.6)', padding:'4px 10px', fontSize:12, cursor:'pointer' }}>
          ↺ Reiniciar
        </button>
      </div>

      {/* Board + tray */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, padding:16, overflowY:'auto' }}>
        {/* Board */}
        <div style={{ borderRadius:12, padding:4, background:`${primaryColor}22`, border:`2px solid ${primaryColor}44` }}>
          {Array.from({ length: gridSize }, (_, row) => (
            <div key={row} style={{ display:'flex' }}>
              {Array.from({ length: gridSize }, (_, col) => {
                const cell       = board[row]?.[col] ?? null
                const isCorrect  = correctCells.has(`${row}-${col}`)
                const isTarget   = selected !== null && !cell
                return (
                  <div
                    key={col}
                    onClick={() => handleCellClick(row, col)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (dragRef.current) { placePiece(row, col, dragRef.current); dragRef.current = null } }}
                    style={{
                      margin: 2, borderRadius: 6, cursor: 'pointer',
                      width: pieceSize, height: pieceSize,
                      background: cell ? 'transparent' : 'rgba(0,0,0,0.3)',
                      outline: isCorrect ? '2px solid #4ade80' : isTarget ? '2px solid rgba(255,255,255,0.4)' : 'none',
                      transition: 'outline 0.2s',
                    }}
                  >
                    {cell && (
                      <div
                        draggable
                        onDragStart={() => { dragRef.current = { piece: cell, from: 'board', boardPos: [row, col] } }}
                        onClick={e => { e.stopPropagation(); if (selected) { placePiece(row, col, { piece: cell, from: 'board', boardPos: [row, col] }); return } setSelected({ piece: cell, from: 'board', boardPos: [row, col] }) }}
                        style={{
                          ...getPieceStyle(cell, gridSize, imageUrl, pieceSize),
                          borderRadius: 6, cursor: 'pointer',
                          outline: isCorrect
                            ? '2px solid #4ade80'
                            : selected?.piece.id === cell.id ? '2px solid white' : 'none',
                          opacity: isCorrect ? 1 : 0.9,
                          transition: 'transform 0.15s, outline 0.15s',
                          transform: selected?.piece.id === cell.id ? 'scale(0.93)' : 'scale(1)',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Tray */}
        {tray.length > 0 && (
          <div style={{ width:'100%', maxWidth:360 }}>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12, textAlign:'center', margin:'0 0 8px' }}>
              {selected?.from === 'tray' ? '¡Ahora haz clic en una celda del tablero!' : 'Piezas disponibles — clic o arrastra'}
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:6, borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.2)', padding:8 }}>
              {tray.map(piece => {
                const sz      = Math.min(pieceSize, 68)
                const isSelTray = selected?.piece.id === piece.id
                return (
                  <div
                    key={piece.id}
                    draggable
                    onDragStart={() => { dragRef.current = { piece, from: 'tray' }; setSelected({ piece, from: 'tray' }) }}
                    onClick={() => handleTrayClick(piece)}
                    style={{
                      ...getPieceStyle(piece, gridSize, imageUrl, sz),
                      borderRadius: 6, cursor: 'pointer',
                      transform: isSelTray ? 'scale(1.1)' : 'scale(1)',
                      outline: isSelTray ? '2px solid white' : 'none',
                      boxShadow: isSelTray ? '0 4px 16px rgba(0,0,0,0.5)' : 'none',
                      opacity: isSelTray ? 1 : 0.9,
                      transition: 'transform 0.15s, outline 0.15s, opacity 0.15s',
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── VTEX IO Site Editor Schema ────────────────────────────────
;(Puzzle as any).schema = {
  title: 'Puzzle — Arma la Imagen',
  description: 'Juego de puzzle para captura de leads en eCommerce.',
  type: 'object',
  properties: {
    title:           { title: 'Título',                    type: 'string',  default: 'Puzzle' },
    description:     { title: 'Descripción',               type: 'string' },
    primaryColor:    { title: 'Color principal',           type: 'string',  default: '#7c3aed', widget: { 'ui:widget': 'color' } },
    secondaryColor:  { title: 'Color de fondo',            type: 'string',  default: '#1e1e30', widget: { 'ui:widget': 'color' } },
    logo:            { title: 'Logo (URL)',                 type: 'string',  widget: { 'ui:widget': 'image-uploader' } },
    backgroundImage: { title: 'Imagen de fondo (URL)',      type: 'string' },
    imageUrl:        { title: 'Imagen del puzzle (URL)',    type: 'string',  default: 'https://picsum.photos/seed/gamestudio/600/600', widget: { 'ui:widget': 'image-uploader' } },
    gridSize: {
      title: 'Tamaño de la cuadrícula', type: 'number',
      enum: [3, 4, 5], enumNames: ['3×3 (9 piezas)', '4×4 (16 piezas)', '5×5 (25 piezas)'], default: 3,
    },
    showTimer:  { title: 'Mostrar temporizador',                    type: 'boolean', default: true  },
    timeLimit:  { title: 'Límite de tiempo en segundos (0=sin límite)', type: 'number',  default: 0 },
    prizes: {
      title: 'Premios (mejor → peor, más rápido → más lento)', type: 'array',
      items: { type: 'object', title: 'Premio', properties: {
        id:          { title: 'ID único',            type: 'string' },
        name:        { title: 'Nombre del premio',   type: 'string' },
        code:        { title: 'Código de descuento', type: 'string' },
        description: { title: 'Descripción',         type: 'string' },
      }},
    },
    woowupPublicKey:          { title: 'Woowup — Clave pública *',           type: 'string' },
    woowupTags:               { title: 'Woowup — Tags',                      type: 'string', default: 'ecommerce,juego,puzzle' },
    woowupServiceUidStrategy: { title: 'Woowup — service_uid',              type: 'string', enum: ['none','email'], enumNames: ['Ninguna','Usar email'], default: 'email' },
    woowupTermsId:            { title: 'Woowup — ID campo términos',         type: 'string', default: 'terms' },
    termsText:                { title: 'Texto términos (HTML)',              type: 'string', widget: { 'ui:widget': 'textarea' } },
    showMarketingOptIn:       { title: 'Mostrar opt-in marketing',           type: 'boolean', default: false },
    marketingOptInLabel:      { title: 'Etiqueta opt-in marketing',          type: 'string' },
    marketingOptInRequired:   { title: '¿Opt-in obligatorio?',              type: 'boolean', default: false },
    prizeCodeKey:             { title: 'Key código en custom_attributes',    type: 'string', default: 'premio_obtenido' },
    localStorageKey:          { title: 'Clave localStorage',                type: 'string', default: 'game_prize_code' },
    mdEnabled:                { title: 'Guardar en Master Data (VTEX)',       type: 'boolean', default: false },
    mdEntity:                 { title: 'Entidad Master Data',                type: 'string', default: 'FL' },
    mdEmailField:             { title: 'Campo email en MD',                  type: 'string', default: 'mail' },
    mdTermsId:                { title: 'Campo términos en MD',               type: 'string', default: 'terms' },
    mdUpdatedInId:            { title: 'Campo timestamp en MD (opcional)',    type: 'string' },
  },
}

export default Puzzle
