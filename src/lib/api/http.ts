import { tokenStore } from './token'
import type { ApiClient } from './interface'
import type { Booking, BookingDraft, ChatEntry } from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const httpClient: ApiClient = {
  async *streamMessage(text: string, history: readonly ChatEntry[]) {
    const token = tokenStore.get()
    if (!token) throw new Error('Not authenticated')

    // Build conversation history for the API (exclude in-progress messages)
    const messages = [
      ...history
        .filter(m => !m.streaming && m.text)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.text })),
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

    if (!res.ok) throw new Error(`Chat API error ${res.status}`)
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

  async confirmBooking(_bookingId: string, draft: BookingDraft): Promise<Booking> {
    // Confirmation is local for now — booking portal wires to API in Sprint 7
    await new Promise(r => setTimeout(r, 600))
    return {
      id:          _bookingId,
      status:      'CONFIRMED',
      draft,
      confirmedAt: new Date().toISOString(),
    }
  },

  async getNudges() {
    return []
  },

  async dismissNudge(_nudgeId: string) {},
  async actOnNudge(_nudgeId: string) {},
}
