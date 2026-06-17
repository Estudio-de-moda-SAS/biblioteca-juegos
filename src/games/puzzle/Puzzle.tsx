import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Grid3X3, Shuffle } from 'lucide-react'
import type { CampaignConfig, GameResult, PuzzleSettings } from '@/shared/types'
import { prizeByThreshold, formatTime } from '@/shared/utils'
import { useTimer } from '@/shared/hooks'
import { GameStartScreen, GameResultScreen } from '@/shared/components'
import { cn } from '@/shared/utils'
import { PUZZLE_INSTRUCTIONS } from './PuzzleConfig'

interface PuzzlePiece {
  id: number
  correctRow: number
  correctCol: number
}

interface Props {
  config: CampaignConfig
  onComplete?: (result: GameResult) => void
}

type Screen = 'start' | 'instructions' | 'playing' | 'result'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getPieceStyle(
  piece: PuzzlePiece,
  gridSize: number,
  imageUrl: string,
  size: number
): React.CSSProperties {
  const bgSize = gridSize * size
  const xPercent =
    gridSize === 1 ? 0 : (piece.correctCol / (gridSize - 1)) * 100
  const yPercent =
    gridSize === 1 ? 0 : (piece.correctRow / (gridSize - 1)) * 100

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${bgSize}px ${bgSize}px`,
    backgroundPosition: `${xPercent}% ${yPercent}%`,
    width: size,
    height: size,
  }
}

export function Puzzle({ config, onComplete }: Props) {
  const settings = config.gameSettings as PuzzleSettings
  const gridSize: 3 | 4 | 5 = settings.gridSize ?? 3
  const imageUrl = settings.imageUrl ?? 'https://picsum.photos/seed/gamestudio/600/600'
  const showTimer = settings.showTimer ?? true
  const timeLimit = settings.timeLimit ?? null

  const [screen, setScreen] = useState<Screen>('start')
  const [result, setResult] = useState<GameResult | null>(null)

  const totalPieces = gridSize * gridSize
  const [tray, setTray] = useState<PuzzlePiece[]>([])
  const [board, setBoard] = useState<(PuzzlePiece | null)[][]>([])
  const [selected, setSelected] = useState<{ piece: PuzzlePiece; from: 'tray' | 'board'; boardPos?: [number, number] } | null>(null)
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState(false)

  const dragRef = useRef<{ piece: PuzzlePiece; from: 'tray' | 'board'; boardPos?: [number, number] } | null>(null)

  const { time, start: startTimer, stop: stopTimer, restart: restartTimer } = useTimer({
    limit: timeLimit ?? undefined,
    onLimit: handleTimeLimit,
  })

  const pieces: PuzzlePiece[] = useMemo(
    () =>
      Array.from({ length: totalPieces }, (_, i) => ({
        id: i,
        correctRow: Math.floor(i / gridSize),
        correctCol: i % gridSize,
      })),
    [totalPieces, gridSize]
  )

  const initGame = useCallback(() => {
    setTray(shuffle(pieces))
    setBoard(Array.from({ length: gridSize }, () => Array(gridSize).fill(null)))
    setSelected(null)
    setCorrectCells(new Set())
    setCompleted(false)
    restartTimer()
  }, [pieces, gridSize, restartTimer])

  useEffect(() => {
    if (screen === 'playing') initGame()
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimeLimit() {
    if (!completed) handleFinish(false)
  }

  function checkCompletion(newBoard: (PuzzlePiece | null)[][]): boolean {
    const newCorrect = new Set<string>()
    let allCorrect = true
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const p = newBoard[r][c]
        if (p && p.correctRow === r && p.correctCol === c) {
          newCorrect.add(`${r}-${c}`)
        } else {
          allCorrect = false
        }
      }
    }
    setCorrectCells(newCorrect)
    return allCorrect
  }

  function handleFinish(success: boolean) {
    stopTimer()
    setCompleted(success)
    const thresholds = (config.gameSettings as PuzzleSettings).timeThresholds ?? [60, 120, 180, 300]
    const prize = prizeByThreshold(time, config.prizes, thresholds)
    const gameResult: GameResult = {
      gameId: 'puzzle',
      score: success ? Math.max(0, 1000 - time * 5) : 0,
      timeElapsed: time,
      completed: success,
      prize,
    }
    setResult(gameResult)
    onComplete?.(gameResult)
    setScreen('result')
  }

  function placePiece(targetRow: number, targetCol: number, source: { piece: PuzzlePiece; from: 'tray' | 'board'; boardPos?: [number, number] }) {
    const newBoard = board.map((row) => [...row])
    const existingInTarget = newBoard[targetRow][targetCol]

    if (source.from === 'tray') {
      newBoard[targetRow][targetCol] = source.piece
      setTray((prev) => prev.filter((p) => p.id !== source.piece.id))
      if (existingInTarget) setTray((prev) => [...prev, existingInTarget])
    } else if (source.boardPos) {
      const [sr, sc] = source.boardPos
      newBoard[targetRow][targetCol] = source.piece
      newBoard[sr][sc] = existingInTarget
    }

    setBoard(newBoard)
    setSelected(null)
    const allCorrect = checkCompletion(newBoard)
    if (allCorrect) handleFinish(true)
  }

  function handleCellClick(row: number, col: number) {
    const cellPiece = board[row][col]

    if (selected) {
      placePiece(row, col, selected)
      return
    }

    if (cellPiece) {
      setSelected({ piece: cellPiece, from: 'board', boardPos: [row, col] })
    }
  }

  function handleTrayClick(piece: PuzzlePiece) {
    if (selected?.piece.id === piece.id && selected.from === 'tray') {
      setSelected(null)
      return
    }
    setSelected({ piece, from: 'tray' })
  }

  const pieceSize = Math.min(Math.floor(280 / gridSize), 100)

  if (screen === 'start') {
    return (
      <GameStartScreen
        config={config}
        icon="🧩"
        onStart={() => setScreen('instructions')}
      />
    )
  }

  if (screen === 'instructions') {
    return (
      <div
        className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center"
        style={{ background: `linear-gradient(135deg, ${config.primaryColor}33, ${config.secondaryColor})` }}
      >
        <div className="text-4xl">🧩</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">¿Cómo jugar?</h2>
          <p className="text-sm text-white/60">Puzzle — {gridSize}×{gridSize}</p>
        </div>
        <ol className="w-full max-w-xs space-y-3 text-left">
          {PUZZLE_INSTRUCTIONS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-white/80">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: config.primaryColor }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <button
          onClick={() => { setScreen('playing'); startTimer() }}
          className="mt-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-xl transition-transform hover:scale-105"
          style={{ backgroundColor: config.primaryColor }}
        >
          ¡Comenzar!
        </button>
      </div>
    )
  }

  if (screen === 'result' && result) {
    return (
      <GameResultScreen
        config={config}
        result={result}
        onReset={() => { setScreen('start') }}
      />
    )
  }

  const placed = board.flat().filter(Boolean).length

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: `linear-gradient(180deg, ${config.secondaryColor} 0%, #0f0f1a 100%)` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shadow-md"
        style={{ backgroundColor: config.primaryColor + '22', borderBottom: `1px solid ${config.primaryColor}44` }}
      >
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Grid3X3 size={14} />
          <span>{placed}/{totalPieces} piezas</span>
        </div>
        {showTimer && (
          <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-white">
            <Clock size={14} className={time > 0 && timeLimit && time >= timeLimit * 0.8 ? 'text-red-400' : 'text-white/70'} />
            {formatTime(time)}
            {timeLimit && <span className="text-xs text-white/40">/ {formatTime(timeLimit)}</span>}
          </div>
        )}
        <button
          onClick={initGame}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Shuffle size={12} /> Reiniciar
        </button>
      </div>

      {/* Board */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <div
          className="rounded-xl p-1 shadow-2xl"
          style={{ backgroundColor: config.primaryColor + '22', border: `2px solid ${config.primaryColor}44` }}
        >
          {Array.from({ length: gridSize }, (_, row) => (
            <div key={row} className="flex">
              {Array.from({ length: gridSize }, (_, col) => {
                const cell = board[row]?.[col] ?? null
                const isCorrect = correctCells.has(`${row}-${col}`)
                const isSelectedTarget = selected !== null && !cell

                return (
                  <div
                    key={col}
                    onClick={() => handleCellClick(row, col)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragRef.current) { placePiece(row, col, dragRef.current); dragRef.current = null } }}
                    className={cn(
                      'm-0.5 cursor-pointer rounded-md transition-all duration-200',
                      cell ? '' : 'bg-black/30',
                      isSelectedTarget && 'ring-2 ring-white/40',
                      isCorrect && 'ring-2 ring-green-400/70'
                    )}
                    style={{ width: pieceSize, height: pieceSize }}
                  >
                    {cell && (
                      <div
                        draggable
                        onDragStart={() => { dragRef.current = { piece: cell, from: 'board', boardPos: [row, col] } }}
                        className={cn(
                          'h-full w-full rounded-md transition-all duration-150',
                          isCorrect ? 'opacity-100 ring-2 ring-green-400' : 'opacity-90',
                          selected?.piece.id === cell.id ? 'scale-95 ring-2 ring-white' : 'hover:scale-95 hover:opacity-100'
                        )}
                        style={getPieceStyle(cell, gridSize, imageUrl, pieceSize)}
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
          <div className="w-full max-w-sm">
            <p className="mb-2 text-center text-xs text-white/50">
              {selected?.from === 'tray' ? '¡Ahora haz clic en una celda del tablero!' : 'Piezas disponibles — haz clic o arrastra'}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 rounded-xl border border-white/10 bg-black/20 p-2">
              {tray.map((piece) => (
                <div
                  key={piece.id}
                  draggable
                  onDragStart={() => { dragRef.current = { piece, from: 'tray' }; setSelected({ piece, from: 'tray' }) }}
                  onClick={() => handleTrayClick(piece)}
                  className={cn(
                    'cursor-pointer rounded-md transition-all duration-150 hover:scale-105',
                    selected?.piece.id === piece.id ? 'scale-110 ring-2 ring-white shadow-xl' : 'opacity-90 hover:opacity-100'
                  )}
                  style={getPieceStyle(piece, gridSize, imageUrl, Math.min(pieceSize, 70))}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
