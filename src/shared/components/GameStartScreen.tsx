import { Play } from 'lucide-react'
import type { CampaignConfig } from '../types'
import { Button } from './Button'

interface GameStartScreenProps {
  config: CampaignConfig
  onStart: () => void
  icon?: string
}

export function GameStartScreen({ config, onStart, icon = '🎮' }: GameStartScreenProps) {
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-8 p-8 text-center"
      style={{
        background: config.backgroundImage
          ? `linear-gradient(to bottom, ${config.primaryColor}80, ${config.secondaryColor}), url(${config.backgroundImage}) center/cover`
          : `linear-gradient(135deg, ${config.primaryColor}33 0%, ${config.secondaryColor} 100%)`,
      }}
    >
      {config.logo ? (
        <img
          src={config.logo}
          alt="Logo"
          className="h-16 w-auto object-contain"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl shadow-xl"
          style={{ backgroundColor: config.primaryColor + '33', border: `2px solid ${config.primaryColor}` }}
        >
          {icon}
        </div>
      )}

      <div className="max-w-sm space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white">{config.title}</h1>
        <p className="text-base text-white/70">{config.description}</p>
      </div>

      {config.prizes.length > 0 && (
        <div className="w-full max-w-xs rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Premios disponibles
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {config.prizes
              .filter((p) => !p.name.toLowerCase().includes('sin'))
              .slice(0, 4)
              .map((prize) => (
                <span
                  key={prize.id}
                  className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white"
                >
                  {prize.name}
                </span>
              ))}
          </div>
        </div>
      )}

      <Button
        size="lg"
        icon={<Play size={20} />}
        onClick={onStart}
        style={{ backgroundColor: config.primaryColor }}
        className="min-w-[180px] shadow-xl"
      >
        ¡Jugar ahora!
      </Button>
    </div>
  )
}
