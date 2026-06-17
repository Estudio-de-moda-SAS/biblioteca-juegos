import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Eye,
  Gift,
  Gamepad2,
  Palette,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { nanoid } from './nanoid'
import { ALL_GAMES, getGame } from '@/games'
import type { CampaignConfig, DifferenceArea, FindDifferencesSettings, GameId, Prize, PuzzleSettings } from '@/shared/types'
import { useCampaignStore } from '@/store/campaignStore'
import { generateConfig, generateEmbedSnippet } from '@/shared/utils'
import {
  Badge,
  Button,
  Card,
  ColorInput,
  Input,
  JsonViewer,
  Modal,
  Select,
  Textarea,
  Toggle,
} from '@/shared/components'
import { cn } from '@/shared/utils'

// ─── Section accordion ──────────────────────────────────────────────────────
function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-surface-100 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-surface-200"
      >
        <span className="flex items-center gap-2">
          {icon} {title}
        </span>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      {open && <div className="space-y-4 bg-surface-50 p-4">{children}</div>}
    </div>
  )
}

// ─── Prize editor ────────────────────────────────────────────────────────────
interface ThresholdPrizeEditorProps {
  prizes: Prize[]
  thresholds: number[]
  unit: string
  unitLabel: string
  onChange: (p: Prize[]) => void
  onThresholdsChange: (t: number[]) => void
}

function ThresholdPrizeEditor({ prizes, thresholds, unit, unitLabel, onChange, onThresholdsChange }: ThresholdPrizeEditorProps) {
  const updatePrize = (id: string, patch: Partial<Prize>) =>
    onChange(prizes.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const updateThreshold = (i: number, val: number) =>
    onThresholdsChange(thresholds.map((t, j) => (j === i ? val : t)))

  const removePrize = (i: number) => {
    if (prizes.length <= 2) return
    const newPrizes = prizes.filter((_, j) => j !== i)
    // Si es el último, no hay umbral que eliminar; si es intermedio, quitar su umbral
    const removeThresholdAt = i < thresholds.length ? i : thresholds.length - 1
    const newThresholds = thresholds.filter((_, j) => j !== removeThresholdAt)
    onChange(newPrizes)
    onThresholdsChange(newThresholds)
  }

  const addPrize = () => {
    const lastT = thresholds[thresholds.length - 1] ?? 0
    const newThreshold = lastT + (unit === 's' ? 60 : 1)
    const fallback = prizes[prizes.length - 1]
    const newPrize: Prize = { id: nanoid(), name: 'Nuevo nivel', probability: 0 }
    const newPrizes = [...prizes.slice(0, -1), newPrize, fallback]
    onChange(newPrizes)
    onThresholdsChange([...thresholds, newThreshold])
  }

  return (
    <div className="space-y-2">
      <p className="mb-3 text-xs text-gray-400">
        Premios ordenados de <span className="text-green-400">mejor</span> a <span className="text-red-400">peor</span>.
        El último es el premio de consolación (sin condición).
      </p>
      {prizes.map((prize, i) => {
        const isLast = i === prizes.length - 1
        return (
          <div key={prize.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <input
                type="text"
                value={prize.name}
                onChange={(e) => updatePrize(prize.id, { name: e.target.value })}
                className="flex-1 rounded-md border border-white/10 bg-surface-100 px-2 py-1 text-sm text-white focus:border-brand-500 focus:outline-none"
                placeholder="Nombre del premio"
              />
              <button
                onClick={() => removePrize(i)}
                disabled={prizes.length <= 2}
                className="rounded-md p-1 text-gray-500 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-30"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={prize.code ?? ''}
                onChange={(e) => updatePrize(prize.id, { code: e.target.value || undefined })}
                className="flex-1 rounded-md border border-white/10 bg-surface-100 px-2 py-1 text-xs font-mono text-white/60 focus:border-brand-500 focus:outline-none"
                placeholder="Código (opcional)"
              />
              {!isLast ? (
                <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                  <span>≤</span>
                  <input
                    type="number"
                    min={0}
                    value={thresholds[i] ?? ''}
                    onChange={(e) => updateThreshold(i, Number(e.target.value))}
                    className="w-16 rounded-md border border-white/10 bg-surface-100 px-1.5 py-1 text-center text-xs text-white focus:border-brand-500 focus:outline-none"
                    title={unitLabel}
                  />
                  <span className="text-gray-500">{unit}</span>
                </div>
              ) : (
                <span className="shrink-0 text-xs text-gray-500">
                  {thresholds.length > 0 ? `> ${thresholds[thresholds.length - 1]} ${unit}` : 'Siempre'}
                </span>
              )}
            </div>
          </div>
        )
      })}
      <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={addPrize}>
        Agregar nivel
      </Button>
    </div>
  )
}

function PrizeEditor({ prizes, onChange }: { prizes: Prize[]; onChange: (p: Prize[]) => void }) {
  const addPrize = () =>
    onChange([...prizes, { id: nanoid(), name: 'Nuevo premio', probability: 10 }])

  const removePrize = (id: string) => onChange(prizes.filter((p) => p.id !== id))

  const updatePrize = (id: string, patch: Partial<Prize>) =>
    onChange(prizes.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const total = prizes.reduce((s, p) => s + p.probability, 0)

  return (
    <div className="space-y-3">
      {prizes.map((prize) => (
        <div key={prize.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={prize.name}
                onChange={(e) => updatePrize(prize.id, { name: e.target.value })}
                className="w-full rounded-md border border-white/10 bg-surface-100 px-2 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none"
                placeholder="Nombre del premio"
              />
              <input
                type="text"
                value={prize.code ?? ''}
                onChange={(e) => updatePrize(prize.id, { code: e.target.value || undefined })}
                className="w-full rounded-md border border-white/10 bg-surface-100 px-2 py-1.5 text-xs font-mono text-white/70 focus:border-brand-500 focus:outline-none"
                placeholder="Código de descuento (opcional)"
              />
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={prize.probability}
                  onChange={(e) => updatePrize(prize.id, { probability: Number(e.target.value) })}
                  className="flex-1 accent-brand-500"
                />
                <span className="w-10 text-right text-xs font-mono text-white">{prize.probability}%</span>
              </div>
            </div>
            <button
              onClick={() => removePrize(prize.id)}
              className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <span className={cn('text-xs', Math.abs(total - 100) > 1 ? 'text-yellow-400' : 'text-green-400')}>
          Total: {total}% {Math.abs(total - 100) > 1 ? '⚠ debe sumar 100%' : '✓'}
        </span>
        <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={addPrize}>
          Agregar premio
        </Button>
      </div>
    </div>
  )
}

// ─── Puzzle settings ─────────────────────────────────────────────────────────
function PuzzleSettingsEditor({
  settings,
  onChange,
}: {
  settings: PuzzleSettings
  onChange: (s: PuzzleSettings) => void
}) {
  return (
    <div className="space-y-4">
      <Input
        label="URL de la imagen"
        type="url"
        value={settings.imageUrl}
        onChange={(e) => onChange({ ...settings, imageUrl: e.target.value })}
        hint="Imagen cuadrada recomendada (600x600 px)"
        placeholder="https://…"
      />
      <Select
        label="Tamaño de cuadrícula"
        value={String(settings.gridSize)}
        onChange={(e) => onChange({ ...settings, gridSize: Number(e.target.value) as 3 | 4 | 5 })}
        options={[
          { value: '3', label: '3×3 — Fácil (9 piezas)' },
          { value: '4', label: '4×4 — Medio (16 piezas)' },
          { value: '5', label: '5×5 — Difícil (25 piezas)' },
        ]}
      />
      <Toggle
        label="Mostrar cronómetro"
        checked={settings.showTimer}
        onChange={(v) => onChange({ ...settings, showTimer: v })}
      />
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">
          Tiempo límite (segundos, 0 = sin límite)
        </label>
        <input
          type="number"
          min={0}
          step={30}
          value={settings.timeLimit ?? 0}
          onChange={(e) => {
            const v = Number(e.target.value)
            onChange({ ...settings, timeLimit: v > 0 ? v : null })
          }}
          className="w-full rounded-lg border border-white/10 bg-surface-100 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        />
      </div>
    </div>
  )
}

// ─── Editor visual de hotspots ────────────────────────────────────────────────
// Muestra la imagen y permite hacer clic para colocar/mover/eliminar hotspots.
function HotspotEditor({
  imageUrl,
  differences,
  selectedRadius,
  onImageClick,
  onRemove,
  onUpdateRadius,
}: {
  imageUrl: string
  differences: DifferenceArea[]
  selectedRadius: number
  onImageClick: (x: number, y: number) => void
  onRemove: (id: string) => void
  onUpdateRadius: (id: string, r: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignorar clic si se hizo sobre un hotspot existente
    const target = e.target as HTMLElement
    if (target.closest('[data-hotspot]')) return

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(1))
    const y = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(1))
    onImageClick(x, y)
  }

  if (!imageUrl) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-white/20 text-sm text-white/40">
        Ingresa una URL de imagen para posicionar los hotspots
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative cursor-crosshair overflow-hidden rounded-xl border border-brand-500/40 shadow-lg"
      style={{ aspectRatio: '8 / 5' }}
      title="Haz clic para agregar una diferencia"
    >
      <img
        src={imageUrl}
        alt="Editor"
        className="pointer-events-none h-full w-full object-cover"
        draggable={false}
      />

      {/* Overlay semitransparente con instrucción */}
      {differences.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <p className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white/80">
            👆 Haz clic sobre la imagen para marcar cada diferencia
          </p>
        </div>
      )}

      {/* Hotspots numerados */}
      {differences.map((d, i) => (
        <div
          key={d.id}
          data-hotspot="true"
          onClick={(e) => { e.stopPropagation(); onRemove(d.id) }}
          title={`Diferencia ${i + 1} — clic para eliminar`}
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
        >
          {/* Zona de detección visual */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-brand-400/60 bg-brand-500/10"
            style={{
              width: `${d.radius * 2.4 * 100 / 100}px`,
              height: `${d.radius * 2.4 * 100 / 100}px`,
              // Usamos tamaño fijo proporcional para el editor (no porcentaje del contenedor)
              minWidth: `${d.radius * 6}px`,
              minHeight: `${d.radius * 6}px`,
            }}
          />
          {/* Número del hotspot */}
          <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-white/30">
            {i + 1}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Find Differences settings ────────────────────────────────────────────────
function FindDifferencesSettingsEditor({
  settings,
  onChange,
}: {
  settings: FindDifferencesSettings
  onChange: (s: FindDifferencesSettings) => void
}) {
  const [defaultRadius, setDefaultRadius] = useState(6)
  const [activeImage, setActiveImage] = useState<'left' | 'right'>('right')

  const addDiff = (x: number, y: number) => {
    onChange({
      ...settings,
      differences: [
        ...settings.differences,
        { id: nanoid(), x, y, radius: defaultRadius, label: `Diferencia ${settings.differences.length + 1}` },
      ],
    })
  }

  const removeDiff = (id: string) =>
    onChange({ ...settings, differences: settings.differences.filter((d) => d.id !== id) })

  const updateRadius = (id: string, radius: number) =>
    onChange({
      ...settings,
      differences: settings.differences.map((d) => (d.id === id ? { ...d, radius } : d)),
    })

  const clearAll = () => onChange({ ...settings, differences: [] })

  const editorImageUrl = activeImage === 'left' ? settings.imageUrl : settings.imageUrlAlt

  return (
    <div className="space-y-4">
      {/* URLs de imágenes */}
      <Input
        label="URL imagen izquierda (original)"
        type="url"
        value={settings.imageUrl}
        onChange={(e) => onChange({ ...settings, imageUrl: e.target.value })}
        hint="La imagen sin modificar"
        placeholder="https://ejemplo.com/imagen-original.jpg"
      />
      <Input
        label="URL imagen derecha (con diferencias)"
        type="url"
        value={settings.imageUrlAlt}
        onChange={(e) => onChange({ ...settings, imageUrlAlt: e.target.value })}
        hint="La misma escena con objetos cambiados, agregados o eliminados"
        placeholder="https://ejemplo.com/imagen-modificada.jpg"
      />

      <Toggle
        label="Mostrar cronómetro"
        checked={settings.showTimer}
        onChange={(v) => onChange({ ...settings, showTimer: v })}
      />

      {/* Radio de detección predeterminado */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">
          Radio de detección al hacer clic: <span className="font-mono text-brand-300">{defaultRadius}%</span>
        </label>
        <input
          type="range"
          min={3}
          max={15}
          value={defaultRadius}
          onChange={(e) => setDefaultRadius(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
        <p className="text-xs text-gray-500">
          Radio más grande = más fácil de acertar; más pequeño = más preciso.
        </p>
      </div>

      {/* Editor visual */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-300">
            Posicionar diferencias
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({settings.differences.length} marcadas)
            </span>
          </p>
          <div className="flex gap-2">
            {/* Selector de imagen para el editor */}
            <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
              <button
                onClick={() => setActiveImage('left')}
                className={cn('px-2 py-1 transition-colors', activeImage === 'left' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white')}
              >
                Original
              </button>
              <button
                onClick={() => setActiveImage('right')}
                className={cn('px-2 py-1 transition-colors', activeImage === 'right' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white')}
              >
                Modificada
              </button>
            </div>
            {settings.differences.length > 0 && (
              <button onClick={clearAll} className="text-xs text-red-400/70 hover:text-red-400">
                Limpiar todo
              </button>
            )}
          </div>
        </div>

        <HotspotEditor
          imageUrl={editorImageUrl}
          differences={settings.differences}
          selectedRadius={defaultRadius}
          onImageClick={addDiff}
          onRemove={removeDiff}
          onUpdateRadius={updateRadius}
        />
        <p className="mt-1.5 text-center text-xs text-white/40">
          Haz clic en la imagen para agregar · Haz clic en un número para eliminar
        </p>
      </div>

      {/* Lista de hotspots con radio ajustable */}
      {settings.differences.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Radio individual por diferencia</p>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {settings.differences.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg bg-black/20 px-3 py-1.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-xs text-gray-400 w-20">
                  X: {d.x.toFixed(0)}% Y: {d.y.toFixed(0)}%
                </span>
                <input
                  type="range"
                  min={3}
                  max={15}
                  value={d.radius}
                  onChange={(e) => updateRadius(d.id, Number(e.target.value))}
                  className="flex-1 accent-brand-500"
                />
                <span className="w-6 text-right text-xs font-mono text-white">{d.radius}</span>
                <button onClick={() => removeDiff(d.id)} className="text-gray-600 hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function CampaignBuilder() {
  const [searchParams] = useSearchParams()
  const gameParam = searchParams.get('game') as GameId | null

  const config = useCampaignStore((s) => s.config)
  const setConfig = useCampaignStore((s) => s.setConfig)
  const setGameId = useCampaignStore((s) => s.setGameId)
  const setPrizes = useCampaignStore((s) => s.setPrizes)
  const setGameSettings = useCampaignStore((s) => s.setGameSettings)
  const resetConfig = useCampaignStore((s) => s.resetConfig)

  const [showJson, setShowJson] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)

  useEffect(() => {
    if (gameParam && gameParam !== config.gameId) {
      setGameId(gameParam)
    }
  }, [gameParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeGame = getGame(config.gameId)
  const jsonConfig = generateConfig(config)
  const embedSnippet = generateEmbedSnippet(config)

  const gameOptions = ALL_GAMES.map(({ meta }) => ({ value: meta.id, label: meta.name }))

  return (
    <div className="flex h-full flex-col">
      {/* Topbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-surface-50 px-6 py-3">
        <div>
          <h1 className="text-lg font-bold text-white">Campaign Builder</h1>
          <p className="text-xs text-gray-500">Configura tu campaña en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={resetConfig}>
            Resetear
          </Button>
          <Button variant="secondary" size="sm" icon={<Code2 size={14} />} onClick={() => setShowJson(true)}>
            JSON
          </Button>
          <Button size="sm" icon={<Eye size={14} />} onClick={() => setShowEmbed(true)}>
            Embed
          </Button>
          <Link
            to={`/preview/${config.gameId}?from=builder`}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <Eye size={14} /> Vista previa
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Config panel */}
        <div className="w-full max-w-sm shrink-0 space-y-3 overflow-y-auto border-r border-white/10 p-4 lg:max-w-md">

          <Section title="Juego" icon={<Gamepad2 size={16} />}>
            <div className="space-y-2">
              {ALL_GAMES.map(({ meta }) => (
                <button
                  key={meta.id}
                  onClick={() => setGameId(meta.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                    config.gameId === meta.id
                      ? 'border-brand-500 bg-brand-500/20 text-white'
                      : 'border-white/10 bg-surface-100 text-gray-300 hover:border-white/30 hover:bg-surface-200'
                  )}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{meta.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{meta.description}</p>
                  </div>
                  {config.gameId === meta.id && (
                    <Badge color="purple">Seleccionado</Badge>
                  )}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Información de la campaña" icon={<span className="text-sm">📋</span>}>
            <Input
              label="Título"
              value={config.title}
              onChange={(e) => setConfig({ title: e.target.value })}
              placeholder="Mi Campaña Genial"
            />
            <Textarea
              label="Descripción"
              value={config.description}
              onChange={(e) => setConfig({ description: e.target.value })}
              placeholder="Participa y gana increíbles premios…"
            />
            <Input
              label="URL del logo"
              type="url"
              value={config.logo}
              onChange={(e) => setConfig({ logo: e.target.value })}
              placeholder="https://…/logo.png"
            />
            <Input
              label="URL imagen de fondo"
              type="url"
              value={config.backgroundImage}
              onChange={(e) => setConfig({ backgroundImage: e.target.value })}
              placeholder="https://…/bg.jpg"
            />
          </Section>

          <Section title="Estilo y colores" icon={<Palette size={16} />}>
            <ColorInput
              label="Color primario"
              value={config.primaryColor}
              onChange={(v) => setConfig({ primaryColor: v })}
              hint="Color de botones y acentos"
            />
            <ColorInput
              label="Color secundario (fondo)"
              value={config.secondaryColor}
              onChange={(v) => setConfig({ secondaryColor: v })}
            />
            <ColorInput
              label="Color de acento"
              value={config.accentColor}
              onChange={(v) => setConfig({ accentColor: v })}
              hint="Para premios y destacados"
            />
          </Section>

          <Section title="Configuración del juego" icon={<Gamepad2 size={16} />}>
            {config.gameId === 'puzzle' ? (
              <PuzzleSettingsEditor
                settings={config.gameSettings as PuzzleSettings}
                onChange={setGameSettings}
              />
            ) : (
              <FindDifferencesSettingsEditor
                settings={config.gameSettings as FindDifferencesSettings}
                onChange={setGameSettings}
              />
            )}
          </Section>

          <Section title="Premios" icon={<Gift size={16} />}>
            {config.gameId === 'find-differences' ? (
              <ThresholdPrizeEditor
                prizes={config.prizes}
                thresholds={(config.gameSettings as FindDifferencesSettings).missThresholds ?? [0, 2, 3, 4]}
                unit="fallos"
                unitLabel="Máximo de fallos"
                onChange={setPrizes}
                onThresholdsChange={(t) =>
                  setGameSettings({ ...(config.gameSettings as FindDifferencesSettings), missThresholds: t })
                }
              />
            ) : config.gameId === 'puzzle' ? (
              <ThresholdPrizeEditor
                prizes={config.prizes}
                thresholds={(config.gameSettings as PuzzleSettings).timeThresholds ?? [60, 120, 180, 300]}
                unit="s"
                unitLabel="Tiempo máximo (seg)"
                onChange={setPrizes}
                onThresholdsChange={(t) =>
                  setGameSettings({ ...(config.gameSettings as PuzzleSettings), timeThresholds: t })
                }
              />
            ) : (
              <PrizeEditor prizes={config.prizes} onChange={setPrizes} />
            )}
          </Section>
        </div>

        {/* Live preview panel */}
        <div className="hidden flex-1 flex-col overflow-hidden lg:flex">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="text-xs font-medium text-gray-500">Vista previa en vivo</span>
            <Badge color="green">Auto-actualiza</Badge>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{ background: '#0f0f1a' }}
            >
              <div
                className="relative overflow-hidden rounded-2xl shadow-2xl"
                style={{ width: 375, height: 667, border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="absolute inset-0 overflow-y-auto">
                  <activeGame.Component config={config} />
                </div>
              </div>
              <p className="absolute bottom-4 text-xs text-gray-600">
                Vista simulada 375×667 — iPhone SE
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* JSON modal */}
      <Modal open={showJson} onClose={() => setShowJson(false)} title="Configuración JSON" size="xl">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Copia este JSON para implementar el juego en Bitex o guardarlo como plantilla.
          </p>
          <JsonViewer value={jsonConfig} />
        </div>
      </Modal>

      {/* Embed modal */}
      <Modal open={showEmbed} onClose={() => setShowEmbed(false)} title="Código de Embed" size="xl">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Inserta este snippet en cualquier página de Bitex para mostrar el juego.
          </p>
          <JsonViewer value={embedSnippet} title="HTML Snippet" />
        </div>
      </Modal>
    </div>
  )
}
