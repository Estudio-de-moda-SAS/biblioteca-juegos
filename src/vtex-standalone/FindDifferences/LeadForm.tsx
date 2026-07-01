// ============================================================
// LeadForm — Formulario standalone para VTEX IO
// Integración Woowup + Master Data (VTEX) + localStorage
// Única dependencia: React.
// Copia este archivo junto a index.tsx en la carpeta del juego.
// ============================================================

import React, { FC, useState } from 'react'

// ── CSS animations ────────────────────────────────────────────
const CSS = `
  @keyframes lfBounceIn {
    0%   { transform:scale(0.3); opacity:0; }
    50%  { transform:scale(1.05); opacity:0.8; }
    100% { transform:scale(1); opacity:1; }
  }
  @keyframes lfSlideUp {
    from { transform:translateY(16px); opacity:0; }
    to   { transform:translateY(0);    opacity:1; }
  }
  @keyframes lfPing {
    0%   { transform:scale(1);   opacity:0.8; }
    100% { transform:scale(2.2); opacity:0; }
  }
  @keyframes lfConfetti {
    0%   { transform:translateY(0)    rotate(0deg);   opacity:1; }
    100% { transform:translateY(-80px) rotate(360deg); opacity:0; }
  }
  .lf-bounce-in { animation: lfBounceIn 0.45s ease-out both; }
  .lf-slide-up  { animation: lfSlideUp  0.3s  ease-out both; }
  .lf-ping      { animation: lfPing 1.2s cubic-bezier(0,0,0.2,1) infinite; }
`

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById('lf-styles')) return
  const el = document.createElement('style')
  el.id = 'lf-styles'
  el.textContent = CSS
  document.head.appendChild(el)
}

// ── Types (exported so index.tsx can import) ──────────────────
export interface Prize {
  id: string
  name: string
  code?: string
  description?: string
}

export interface WoowupConfig {
  publicKey: string
  tags?: string
  serviceUidStrategy?: 'none' | 'email'
  termsWoowupId?: string
  termsText?: string
  showMarketingOptIn?: boolean
  marketingOptInLabel?: string
  marketingOptInRequired?: boolean
  sendUpdatedIn?: boolean
  updatedInKey?: string
  prizeCodeKey?: string
  localStorageKey?: string
  mdEnabled?: boolean
  mdEntity?: string
  mdEmailField?: string
  mdTermsId?: string
  mdUpdatedInId?: string
}

export interface LeadFormProps {
  won: boolean
  prize: Prize | null
  primaryColor: string
  woowup?: WoowupConfig
  gameId?: string
  onReset: () => void
  statsSlot?: React.ReactNode
}

// ── Helpers ───────────────────────────────────────────────────
const EMAIL_RGX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const WOOWUP_URL = 'https://events.woowup.com/events/users'
const BOGOTA_OFFSET = -300

function fmtBogota(date: Date): string {
  const d = new Date(date.getTime() + BOGOTA_OFFSET * 60000)
  const p = (n: number) => (n < 10 ? '0' + n : String(n))
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}-05:00`
}

async function upsertMD(
  entity: string,
  emailField: string,
  email: string,
  body: Record<string, unknown>
) {
  try {
    const res = await fetch(
      `/api/dataentities/${entity}/search?_where=${emailField}=${encodeURIComponent(email)}&_fields=id`,
      { headers: { Accept: 'application/vnd.vtex.ds.v10+json' } }
    )
    const found = (await res.json()) as Array<{ id: string }>
    const method = found && found.length > 0 ? 'PATCH' : 'POST'
    const url =
      found && found.length > 0
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
  } catch (_e) { /* silently ignore outside VTEX */ }
}

const CONFETTI_COLORS = ['#8b5cf6', '#f59e0b', '#4ade80', '#ec4899', '#60a5fa', '#f97316']
const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${(i / 24) * 100 + (Math.random() * 4 - 2)}%`,
  top:  `${8 + Math.random() * 18}%`,
  delay: `${(Math.random() * 0.5).toFixed(2)}s`,
  dur:   `${(0.9 + Math.random() * 0.7).toFixed(2)}s`,
}))

const DEFAULT_TERMS =
  'Acepto la <a href="/politica-de-privacidad" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">política de privacidad</a> y los <a href="/terminos-y-condiciones" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">términos y condiciones</a>'

// ── Inline input ──────────────────────────────────────────────
const Field: FC<{
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div style={{ marginBottom: 8 }}>
    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500, margin: '0 0 4px' }}>{label}</p>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 12px', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)',
        borderRadius: 8, color: 'white', fontSize: 13, outline: 'none',
        transition: 'border-color 0.2s',
      }}
      onFocus={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.35)' }}
      onBlur={e   => { e.target.style.borderColor = 'rgba(255,255,255,0.13)' }}
    />
  </div>
)

// ── Component ─────────────────────────────────────────────────
type FormStatus = 'idle' | 'pending' | 'success' | 'error'

export const LeadForm: FC<LeadFormProps> = ({
  won,
  prize,
  primaryColor,
  woowup,
  gameId = 'game',
  onReset,
  statsSlot,
}) => {
  React.useEffect(() => { injectStyles() }, [])

  const hasCode = won && !!prize?.code && !prize.name.toLowerCase().includes('sin')

  const [revealed,   setRevealed]   = useState(false)
  const [showForm,   setShowForm]   = useState(!won)
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [documento,  setDocumento]  = useState('')
  const [telephone,  setTelephone]  = useState('')
  const [email,      setEmail]      = useState('')
  const [terms,      setTerms]      = useState(false)
  const [marketing,  setMarketing]  = useState(false)
  const [status,     setStatus]     = useState<FormStatus>('idle')
  const [errorMsg,   setErrorMsg]   = useState('')

  function handleReveal() {
    setRevealed(true)
    setTimeout(() => setShowForm(true), 900)
    if (hasCode && prize && prize.code) {
      try {
        localStorage.setItem(
          woowup ? woowup.localStorageKey || 'game_prize_code' : 'game_prize_code',
          JSON.stringify({ code: prize.code, name: prize.name, gameId, obtainedAt: new Date().toISOString() })
        )
      } catch (_e) { /* blocked */ }
    }
  }

  async function handleSubmit() {
    setErrorMsg('')
    if (!firstName.trim() || !lastName.trim()) { setErrorMsg('⚠ Completa nombre y apellido.'); return }
    if (!EMAIL_RGX.test(email.trim()))           { setErrorMsg('⚠ Ingresa un email válido.'); return }
    if (!terms)                                  { setErrorMsg('⚠ Acepta los términos y condiciones.'); return }
    if (woowup && woowup.marketingOptInRequired && !marketing) { setErrorMsg('⚠ Acepta el consentimiento de marketing.'); return }

    if (!woowup || !woowup.publicKey) { setStatus('success'); return }

    setStatus('pending')
    const ts = fmtBogota(new Date())
    const prizeKey = woowup.prizeCodeKey || 'premio_obtenido'
    const customAttr: Record<string, string> = {
      consent: 'accepted', consent_ts: new Date().toISOString(),
      juego: gameId, nombre_premio: prize ? prize.name : '',
    }
    if (woowup.sendUpdatedIn !== false) customAttr[woowup.updatedInKey || 'updated_in'] = ts
    if (hasCode && prize && prize.code) customAttr[prizeKey] = prize.code

    const payload: Record<string, unknown> = {
      app: woowup.publicKey,
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      document:   documento.trim() || undefined,
      telephone:  telephone.trim() || undefined,
      email:      email.trim(),
      tags:       woowup.tags || '',
      custom_attributes: customAttr,
    }
    if (woowup.termsWoowupId) payload[woowup.termsWoowupId] = terms
    if (woowup.showMarketingOptIn) {
      payload['mailing_enabled'] = marketing ? 'enabled' : 'disabled'
      payload['sms_enabled']     = marketing ? 'enabled' : 'disabled'
    }
    if (woowup.serviceUidStrategy === 'email') payload['service_uid'] = email.trim()

    try {
      const res = await fetch(WOOWUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())

      if (woowup.mdEnabled) {
        const md: Record<string, unknown> = {
          [woowup.mdEmailField || 'mail']:  email.trim(),
          [woowup.mdTermsId    || 'terms']: terms,
          consent: 'accepted', consent_ts: new Date().toISOString(),
        }
        if (documento.trim()) md['documento'] = documento.trim()
        if (woowup.sendUpdatedIn !== false && woowup.mdUpdatedInId) md[woowup.mdUpdatedInId] = ts
        if (hasCode && prize && prize.code) md[prizeKey] = prize.code
        await upsertMD(woowup.mdEntity || 'FL', woowup.mdEmailField || 'mail', email.trim(), md)
      }
      setStatus('success')
    } catch (err) {
      console.error('[LeadForm] Woowup error:', err)
      setErrorMsg('No pudimos completar el registro. Intenta de nuevo.')
      setStatus('error')
    }
  }

  const canSubmit = !!firstName && !!lastName && !!email && terms && status !== 'pending'

  const card: React.CSSProperties = {
    borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)', padding: 16,
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100%', padding: 24, overflowY: 'auto',
      background: `linear-gradient(135deg, ${primaryColor}22 0%, #1e1e30 100%)`,
    }}>
      {/* Confetti */}
      {revealed && hasCode && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
          {CONFETTI.map((p, i) => (
            <div key={i} style={{
              position: 'absolute', width: 9, height: 9, borderRadius: 2,
              left: p.left, top: p.top, background: p.color,
              animation: `lfConfetti ${p.dur} ${p.delay} ease-out forwards`,
            }} />
          ))}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{won ? '🏆' : '😕'}</div>
          <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
            {won ? '¡Felicitaciones!' : 'No fue esta vez'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0 }}>
            {won ? '¡Lo lograste!' : '¡Sigue intentando!'}
          </p>
        </div>

        {/* Stats slot */}
        {statsSlot && <div style={{ marginBottom: 20 }}>{statsSlot}</div>}

        {/* Prize reveal button */}
        {won && !revealed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={handleReveal}
                style={{
                  width: 148, height: 148, borderRadius: '50%',
                  border: `2px dashed ${primaryColor}`,
                  background: `${primaryColor}1a`, cursor: 'pointer', outline: 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = `0 0 24px ${primaryColor}55` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span style={{ fontSize: 44 }}>🎁</span>
                <span style={{ color: primaryColor, fontSize: 12, fontWeight: 700 }}>¡Ver mi premio!</span>
              </button>
              <div className="lf-ping" style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: `1px solid ${primaryColor}`, pointerEvents: 'none',
              }} />
            </div>
          </div>
        )}

        {/* Prize revealed */}
        {won && revealed && prize && (
          <div className="lf-bounce-in" style={{
            ...card, textAlign: 'center', marginBottom: 20,
            background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.28)',
          }}>
            <p style={{ color: 'rgba(234,179,8,0.8)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px' }}>
              Tu premio
            </p>
            <p style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{prize.name}</p>
            {prize.description && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 8px' }}>{prize.description}</p>
            )}
            {hasCode && (
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>
                Regístrate abajo para obtener tu código
              </p>
            )}
          </div>
        )}

        {/* Form */}
        {showForm && status !== 'success' && (
          <div className="lf-slide-up" style={{ ...card, marginBottom: 16 }}>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'center', margin: '0 0 14px' }}>
              {hasCode
                ? '🎁 Suscríbete para recibir tu código'
                : won
                  ? '¡Déjanos tus datos!'
                  : 'Déjanos tus datos para futuras promos'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Nombre *"   value={firstName}  onChange={setFirstName}  placeholder="Juan" />
              <Field label="Apellido *" value={lastName}   onChange={setLastName}   placeholder="García" />
            </div>
            <Field label="Documento / Cédula" value={documento}  onChange={setDocumento}  placeholder="12345678" />
            <Field label="Teléfono"           type="tel"   value={telephone} onChange={setTelephone} placeholder="+57 300 000 0000" />
            <Field label="Email *"            type="email" value={email}     onChange={setEmail}     placeholder="tu@email.com" />

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
              <input
                type="checkbox" checked={terms}
                onChange={e => { setTerms(e.target.checked); setErrorMsg('') }}
                style={{ marginTop: 2, width: 15, height: 15, flexShrink: 0 }}
              />
              <span
                style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: woowup && woowup.termsText ? woowup.termsText : DEFAULT_TERMS }}
              />
            </label>

            {/* Marketing opt-in */}
            {woowup && woowup.showMarketingOptIn && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
                <input
                  type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)}
                  style={{ marginTop: 2, width: 15, height: 15, flexShrink: 0 }}
                />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5 }}>
                  {woowup.marketingOptInLabel || 'Acepto recibir comunicaciones de marketing (Email y SMS)'}
                </span>
              </label>
            )}

            {errorMsg && (
              <p style={{ color: '#f87171', fontSize: 12, margin: '4px 0 0' }}>{errorMsg}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%', padding: '11px 0', marginTop: 10,
                background: canSubmit ? primaryColor : 'rgba(255,255,255,0.12)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                opacity: canSubmit ? 1 : 0.6,
                transition: 'background 0.2s, opacity 0.2s',
              }}
            >
              {status === 'pending'
                ? '⏳ Enviando...'
                : hasCode
                  ? '🎁 Obtener mi código'
                  : 'Enviar mis datos'}
            </button>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="lf-bounce-in" style={{
            ...card, textAlign: 'center', marginBottom: 16,
            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.28)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            {hasCode && prize && prize.code ? (
              <>
                <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
                  ¡Registro exitoso! Tu código es:
                </p>
                <div style={{
                  display: 'inline-block', padding: '10px 24px',
                  background: `${primaryColor}44`, border: `2px dashed ${primaryColor}`,
                  borderRadius: 10, color: 'white', fontSize: 24, fontWeight: 700,
                  letterSpacing: 4, fontFamily: 'monospace', margin: '0 0 8px',
                }}>
                  {prize.code}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                  Úsalo en el checkout de tu próxima compra
                </p>
              </>
            ) : (
              <p style={{ color: '#86efac', fontSize: 14, fontWeight: 500, margin: 0 }}>
                ¡Datos enviados! Te contactaremos pronto.
              </p>
            )}
          </div>
        )}

        {/* Reset */}
        <button
          onClick={onReset}
          style={{
            width: '100%', padding: '10px 0',
            background: 'transparent', color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10,
            fontSize: 13, cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          ↺ Jugar de nuevo
        </button>
      </div>
    </div>
  )
}
