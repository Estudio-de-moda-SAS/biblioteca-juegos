import { useState, type ReactNode } from 'react'
import { Gift, RotateCcw, CheckCircle2, Trophy, Frown } from 'lucide-react'
import type { CampaignConfig, GameResult, WawSubmitStatus } from '../types'
import { ConfettiEffect } from './PrizeReveal'
import { Input } from './FormField'
import { Button } from './Button'

const WOOWUP_ENDPOINT = 'https://events.woowup.com/events/users'
const EMAIL_RGX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BOGOTA_OFFSET = -300 // UTC-5, sin DST

const DEFAULT_TERMS_HTML =
  'Acepto la <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;color:inherit">política de privacidad</a> y los <a href="/terminos" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;color:inherit">términos y condiciones</a>'

interface Props {
  config: CampaignConfig
  result: GameResult
  /** Slot para mostrar estadísticas específicas del juego */
  statsSlot?: ReactNode
  onReset: () => void
}

// Genera timestamp con offset fijo (Bogotá UTC-5)
function fmtOffset(date: Date, offsetMin: number): string {
  const d = new Date(date.getTime() + offsetMin * 60_000)
  const p = (n: number) => String(n).padStart(2, '0')
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}` +
    `${sign}${p(Math.floor(abs / 60))}:${p(abs % 60)}`
  )
}

// Upsert en VTEX Master Data (sólo funciona dentro de VTEX IO)
async function upsertMD(
  entity: string,
  emailField: string,
  email: string,
  body: Record<string, unknown>
) {
  const res = await fetch(
    `/api/dataentities/${entity}/search?_where=${emailField}=${encodeURIComponent(email)}&_fields=id`,
    { headers: { Accept: 'application/vnd.vtex.ds.v10+json' } }
  )
  const found = (await res.json()) as Array<{ id: string }>
  const method = found?.length > 0 ? 'PATCH' : 'POST'
  const url =
    found?.length > 0
      ? `/api/dataentities/${entity}/documents/${found[0].id}`
      : `/api/dataentities/${entity}/documents`
  await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.vtex.ds.v10+json',
    },
    body: JSON.stringify(body),
  })
}

export function GameLeadForm({ config, result, statsSlot, onReset }: Props) {
  const wo = config.woowupConfig
  const prize = result.prize
  const won = result.completed
  const hasCode =
    won && !!prize?.code && !prize.name.toLowerCase().includes('sin')

  // ── Estado del formulario ─────────────────────────────────────────────────
  const [revealed, setRevealed] = useState(false)
  const [showForm, setShowForm] = useState(!won) // si perdió, muestra form inmediatamente
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [documento, setDocumento] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [terms, setTerms] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [status, setStatus] = useState<WawSubmitStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // ── Reveal del premio ─────────────────────────────────────────────────────
  const handleReveal = () => {
    setRevealed(true)
    setTimeout(() => setShowForm(true), 900)

    // Guardar código en localStorage en el momento de revelar
    if (hasCode && prize?.code) {
      try {
        localStorage.setItem(
          wo?.localStorageKey ?? 'game_prize_code',
          JSON.stringify({
            code: prize.code,
            name: prize.name,
            gameId: result.gameId,
            obtainedAt: new Date().toISOString(),
          })
        )
      } catch {
        /* localStorage bloqueado */
      }
    }
  }

  // ── Envío del formulario ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorMsg('')

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('⚠️ Completa nombre y apellido.')
      return
    }
    if (!EMAIL_RGX.test(email.trim())) {
      setErrorMsg('⚠️ Ingresa un email válido.')
      return
    }
    if (!terms) {
      setErrorMsg('⚠️ Debes aceptar los términos y condiciones.')
      return
    }
    if (wo?.marketingOptInRequired && !marketing) {
      setErrorMsg('⚠️ Debes aceptar el consentimiento de marketing.')
      return
    }

    // Sin clave pública → modo demo (éxito visual)
    if (!wo?.publicKey) {
      setStatus('success')
      return
    }

    setStatus('pending')

    const ts = fmtOffset(new Date(), BOGOTA_OFFSET)
    const prizeKey = wo.prizeCodeKey ?? 'premio_obtenido'

    const customAttr: Record<string, string> = {
      consent: 'accepted',
      consent_ts: new Date().toISOString(),
      juego: result.gameId,
      nombre_premio: prize?.name ?? '',
    }
    if (wo.sendUpdatedIn !== false) {
      customAttr[wo.updatedInKey ?? 'updated_in'] = ts
    }
    if (hasCode && prize?.code) {
      customAttr[prizeKey] = prize.code
    }

    const payload: Record<string, unknown> = {
      app: wo.publicKey,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      document: documento.trim() || undefined,
      telephone: telephone.trim() || undefined,
      email: email.trim(),
      tags: wo.tags ?? '',
      custom_attributes: customAttr,
    }
    if (wo.termsWoowupId) payload[wo.termsWoowupId] = terms
    if (wo.showMarketingOptIn) {
      payload.mailing_enabled = marketing ? 'enabled' : 'disabled'
      payload.sms_enabled = marketing ? 'enabled' : 'disabled'
    }
    if (wo.serviceUidStrategy === 'email') {
      payload.service_uid = email.trim()
    }

    try {
      const res = await fetch(WOOWUP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())

      // Master Data (sólo dentro de VTEX IO; falla silenciosamente fuera)
      if (wo.mdEnabled) {
        try {
          const md: Record<string, unknown> = {
            [wo.mdEmailField ?? 'mail']: email.trim(),
            [wo.mdTermsId ?? 'terms']: terms,
            consent: 'accepted',
            consent_ts: new Date().toISOString(),
          }
          if (documento.trim()) md['documento'] = documento.trim()
          if (wo.sendUpdatedIn !== false && wo.mdUpdatedInId) {
            md[wo.mdUpdatedInId] = ts
          }
          if (hasCode && prize?.code) md[prizeKey] = prize.code
          await upsertMD(
            wo.mdEntity ?? 'FL',
            wo.mdEmailField ?? 'mail',
            email.trim(),
            md
          )
        } catch {
          /* silencioso fuera de VTEX */
        }
      }

      setStatus('success')
    } catch (err) {
      console.error('[GameLeadForm] Woowup error:', err)
      setStatus('error')
      setErrorMsg('No pudimos completar el registro. Intenta de nuevo.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-5 overflow-y-auto p-6 text-center"
      style={{
        background: `linear-gradient(135deg, ${config.primaryColor}33 0%, ${config.secondaryColor} 100%)`,
      }}
    >
      <ConfettiEffect active={revealed && !!hasCode} />

      <div className="w-full max-w-sm space-y-5">
        {/* ── Encabezado ───────────────────────────────────────────────────── */}
        <div className="space-y-1">
          {won ? (
            <Trophy size={40} className="mx-auto text-yellow-400 drop-shadow-lg" />
          ) : (
            <Frown size={40} className="mx-auto text-white/50" />
          )}
          <h2 className="text-2xl font-bold text-white">
            {won ? '¡Felicitaciones!' : 'Lo sentimos'}
          </h2>
          <p className="text-sm text-white/60">
            {won ? '¡Lo lograste!' : 'No fue esta vez — ¡sigue intentando!'}
          </p>
        </div>

        {/* ── Estadísticas del juego (slot) ─────────────────────────────── */}
        {statsSlot}

        {/* ── Botón de reveal (ganó) ────────────────────────────────────── */}
        {won && !revealed && (
          <button
            onClick={handleReveal}
            aria-label="Ver mi premio"
            className="group relative mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border-2 border-dashed transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2"
            style={{
              borderColor: config.primaryColor,
              backgroundColor: config.primaryColor + '20',
            }}
          >
            <Gift
              size={44}
              className="transition-transform duration-300 group-hover:scale-110"
              style={{ color: config.primaryColor }}
            />
            <span
              className="mt-2 text-xs font-semibold"
              style={{ color: config.primaryColor }}
            >
              ¡Ver mi premio!
            </span>
            <span
              className="absolute inset-0 animate-ping rounded-full border opacity-30"
              style={{ borderColor: config.primaryColor }}
            />
          </button>
        )}

        {/* ── Premio revelado (sólo nombre, sin código) ─────────────────── */}
        {won && revealed && prize && (
          <div className="animate-bounce-in rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80">
              Tu premio
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{prize.name}</p>
            {prize.description && (
              <p className="mt-1 text-sm text-white/60">{prize.description}</p>
            )}
            {hasCode && (
              <p className="mt-2 text-xs text-white/50">
                ¡Regístrate para obtener tu código de descuento!
              </p>
            )}
          </div>
        )}

        {/* ── Formulario de suscripción ─────────────────────────────────── */}
        {showForm && status !== 'success' && (
          <div className="animate-slide-up space-y-3 rounded-xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-sm">
            <p className="text-center text-sm font-semibold text-white">
              {hasCode
                ? '🎁 Suscríbete para recibir tu código'
                : won
                  ? '¡Déjanos tus datos para participar!'
                  : 'Déjanos tus datos para futuras promociones'}
            </p>

            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Nombre *"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  setErrorMsg('')
                }}
                placeholder="Juan"
              />
              <Input
                label="Apellido *"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  setErrorMsg('')
                }}
                placeholder="García"
              />
            </div>

            <Input
              label="Documento / Cédula"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="12345678"
            />

            <Input
              label="Teléfono"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+57 300 000 0000"
            />

            <Input
              label="Email *"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrorMsg('')
              }}
              placeholder="tu@email.com"
            />

            {/* Términos y condiciones */}
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => {
                  setTerms(e.target.checked)
                  setErrorMsg('')
                }}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded"
                style={{ accentColor: config.primaryColor }}
                required
              />
              <span
                className="text-xs leading-relaxed text-white/70"
                dangerouslySetInnerHTML={{
                  __html: wo?.termsText ?? DEFAULT_TERMS_HTML,
                }}
              />
            </label>

            {/* Opt-in marketing (opcional) */}
            {wo?.showMarketingOptIn && (
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded"
                  style={{ accentColor: config.primaryColor }}
                  required={wo.marketingOptInRequired}
                />
                <span className="text-xs leading-relaxed text-white/70">
                  {wo.marketingOptInLabel ??
                    'Acepto recibir comunicaciones de marketing (Email y SMS)'}
                </span>
              </label>
            )}

            {errorMsg && (
              <p className="text-xs text-red-400">{errorMsg}</p>
            )}

            <Button
              className="w-full"
              loading={status === 'pending'}
              disabled={!firstName || !lastName || !email || !terms}
              onClick={handleSubmit}
              style={{ backgroundColor: config.primaryColor }}
            >
              {hasCode ? '🎁 Obtener mi código' : 'Enviar datos'}
            </Button>
          </div>
        )}

        {/* ── Pantalla de éxito ─────────────────────────────────────────── */}
        {status === 'success' && (
          <div className="animate-bounce-in space-y-3 rounded-xl border border-green-500/30 bg-green-500/20 p-5 text-center">
            <CheckCircle2 size={32} className="mx-auto text-green-400" />
            {hasCode && prize?.code ? (
              <>
                <p className="text-sm font-semibold text-white">
                  ¡Registro exitoso! Tu código de descuento es:
                </p>
                <div
                  className="mx-auto inline-block rounded-xl px-6 py-3 text-xl font-bold tracking-widest text-white"
                  style={{
                    backgroundColor: config.primaryColor + '55',
                    border: `2px dashed ${config.primaryColor}`,
                  }}
                >
                  {prize.code}
                </div>
                <p className="text-xs text-white/60">
                  Úsalo en el checkout de tu próxima compra
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-green-300">
                ¡Datos enviados! Te contactaremos pronto con futuras
                promociones.
              </p>
            )}
          </div>
        )}

        {/* ── Jugar de nuevo ────────────────────────────────────────────── */}
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
