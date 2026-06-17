import type { WawLeadPayload, WawResponse } from '@/shared/types'

const WAW_ENDPOINT = import.meta.env.VITE_WAW_ENDPOINT ?? ''

export async function submitLead(payload: WawLeadPayload): Promise<WawResponse> {
  if (!WAW_ENDPOINT) {
    console.info('[WawService] No endpoint configured — lead payload (demo):', payload)
    return { success: true, leadId: `demo-${Date.now()}`, message: 'Demo mode: lead not submitted.' }
  }

  try {
    const res = await fetch(WAW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const error = await res.text()
      return { success: false, error }
    }

    const data = (await res.json()) as WawResponse
    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export function buildLeadPayload(
  partial: Omit<WawLeadPayload, 'completedAt'>
): WawLeadPayload {
  return { ...partial, completedAt: new Date().toISOString() }
}
