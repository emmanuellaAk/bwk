import type { ApiClient } from './interface'

export const httpClient: ApiClient = {
  async *streamMessage(_text: string) {
    throw new Error('HTTP client not implemented')
  },

  async confirmBooking(_bookingId: string, _draft: import('./types').BookingDraft) {
    throw new Error('HTTP client not implemented')
  },

  async getNudges() {
    throw new Error('HTTP client not implemented')
  },

  async dismissNudge(_nudgeId: string) {
    throw new Error('HTTP client not implemented')
  },

  async actOnNudge(_nudgeId: string) {
    throw new Error('HTTP client not implemented')
  },
}
