import { tokenStore } from './token'
import { api } from './base'
import type { ApiClient } from './interface'
import type { Booking, BookingDraft, ChatEntry, Nudge } from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// A card-only reply (earnings/schedule/inventory/booking) streams no token text —
// give the model back a real description of what it showed instead of nothing,
// so a run of card replies doesn't look like a run of never-answered user turns.
function entryContent(m: ChatEntry): string | null {
  if (m.text) return m.text
  if (m.avail) return `${m.avail.title}: ${m.avail.body}`
  if (m.earnings) return `This week — revenue ${m.earnings.revenue}, expenses ${m.earnings.expenses}, profit ${m.earnings.profit} (${m.earnings.delta})`
  if (m.booking) {
    const d = m.booking.draft
    return `Booking draft for ${d.name}: ${d.style}, ${d.date} ${d.time}, GH₵${d.price} (GH₵${d.deposit} deposit)`
  }
  return null
}

export const httpClient: ApiClient = {
  async *streamMessage(text: string, history: readonly ChatEntry[]) {
    const token = tokenStore.get()
    if (!token) throw new Error('Not authenticated')

    // Build conversation history for the API (exclude in-progress messages)
    const messages = [
      ...history
        .filter(m => !m.streaming)
        .flatMap(m => {
          const content = entryContent(m)
          return content ? [{ role: m.role as 'user' | 'assistant', content }] : []
        }),
      { role: 'user' as const, content: text },
    ]

    const res = await fetch(`${BASE}/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { code?: string; message?: string }
      throw new Error(body.code ?? `Chat API error ${res.status}`)
    }
    if (!res.body) throw new Error('No response body')

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue

        let event: { type: string; value?: unknown }
        try { event = JSON.parse(raw) } catch { continue }

        switch (event.type) {
          case 'token':
            yield { token: event.value as string }
            break
          case 'booking':
            yield { booking: event.value as Booking }
            break
          case 'earnings':
            yield { earnings: event.value as import('./types').EarningsChunk }
            break
          case 'avail':
            yield { avail: event.value as import('./types').AvailChunk }
            break
          case 'error':
            throw new Error(event.value as string)
          case 'done':
            yield { done: true }
            return
        }
      }
    }

    yield { done: true }
  },

  async confirmBooking(bookingId: string, draft: BookingDraft): Promise<Booking> {
    const res = await fetch(`${BASE}/v1/chat/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStore.get() ?? ''}`,
      },
      body: JSON.stringify({ booking_id: bookingId, draft }),
    })
    if (!res.ok) throw new Error(`Booking API error ${res.status}`)
    return res.json() as Promise<Booking>
  },

  async recordInventoryPurchase(input) {
    await api.post('/v1/chat/inventory-purchases', input)
  },

  async getNudges() {
    return api.get<Nudge[]>('/v1/nudges')
  },

  async dismissNudge(nudgeId: string) {
    await api.post(`/v1/nudges/${encodeURIComponent(nudgeId)}/dismiss`)
  },
  async actOnNudge(nudgeId: string) {
    await api.post(`/v1/nudges/${encodeURIComponent(nudgeId)}/act`)
  },
}
