import { useState } from 'react'
import { RotateCcw, Send } from 'lucide-react'
import type { CampaignConfig, GameResult, WawSubmitStatus } from '../types'
import { formatTime } from '../utils'
import { buildLeadPayload, submitLead } from '@/services/wawService'
import { Button } from './Button'
import { Input } from './FormField'
import { PrizeReveal, ConfettiEffect } from './PrizeReveal'

interface GameResultScreenProps {
  config: CampaignConfig
  result: GameResult
  onReset: () => void
}

export function GameResultScreen({ config, result, onReset }: GameResultScreenProps) {
  const [revealed, setRevealed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitStatus, setSubmitStatus] = useState<WawSubmitStatus>('idle')

  const handleReveal = () => {
    setRevealed(true)
    setTimeout(() => setShowForm(true), 1200)
  }

  const handleSubmit = async () => {
    if (!name || !email) return
    setSubmitStatus('pending')
    const payload = buildLeadPayload({
      name,
      email,
      phone: phone || undefined,
      campaignId: config.title.toLowerCase().replace(/\s+/g, '-'),
      campaignTitle: config.title,
      gameId: result.gameId,
      score: result.score,
      timeElapsed: result.timeElapsed,
      prize: result.prize,
    })
    const res = await submitLead(payload)
    setSubmitStatus(res.success ? 'success' : 'error')
  }

  const won = result.prize !== null && !result.prize.name.toLowerCase().includes('sin')

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-6 overflow-y-auto p-6 text-center"
      style={{
        background: `linear-gradient(135deg, ${config.primaryColor}33 0%, ${config.secondaryColor} 100%)`,
      }}
    >
      <ConfettiEffect active={revealed && won} />

      <div className="w-full max-w-sm space-y-6">
        <div>
          <p className="text-sm text-white/60">
            {result.completed ? '¡Completado!' : 'Tiempo agotado'} •{' '}
            {formatTime(result.timeElapsed)}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">Tu Premio</h2>
        </div>

        <PrizeReveal prize={result.prize} revealed={revealed} onReveal={handleReveal} />

        {revealed && showForm && submitStatus !== 'success' && (
          <div className="animate-slide-up space-y-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-medium text-white">
              {won
                ? '¡Deja tus datos para reclamar tu premio!'
                : 'Déjanos tus datos para participar en futuras promociones'}
            </p>
            <div className="space-y-3 text-left">
              <Input
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
              <Input
                label="Teléfono (opcional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 000 0000"
              />
            </div>
            <Button
              className="w-full"
              icon={<Send size={16} />}
              loading={submitStatus === 'pending'}
              disabled={!name || !email}
              onClick={handleSubmit}
              style={{ backgroundColor: config.primaryColor }}
            >
              Reclamar premio
            </Button>
            {submitStatus === 'error' && (
              <p className="text-xs text-red-400">Error al enviar. Intenta nuevamente.</p>
            )}
          </div>
        )}

        {submitStatus === 'success' && (
          <div className="animate-bounce-in rounded-xl border border-green-500/30 bg-green-500/20 p-4">
            <p className="text-sm font-medium text-green-300">
              ¡Datos enviados correctamente! Te contactaremos pronto.
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          icon={<RotateCcw size={16} />}
          onClick={onReset}
          className="w-full border border-white/20 text-white hover:bg-white/10"
        >
          Jugar de nuevo
        </Button>
      </div>
    </div>
  )
}
