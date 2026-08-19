import { mockClient } from './mock'
import { httpClient } from './http'
import { tokenStore } from './token'
import type { ApiClient } from './interface'
import type { ChatEntry } from './types'

// Route to real API when authenticated, mock otherwise
export const apiClient: ApiClient = {
  async *streamMessage(text: string, history: readonly ChatEntry[]) {
    if (tokenStore.get()) {
      try {
        yield* httpClient.streamMessage(text, history)
      } catch (error) {
        // Keep the demo usable when Gemini is not configured locally.
        if (import.meta.env.DEV && error instanceof Error && ['AI_NOT_CONFIGURED', 'AI_PROVIDER_UNAVAILABLE'].includes(error.message)) {
          yield* mockClient.streamMessage(text, history)
          return
        }
        throw error
      }
    } else {
      yield* mockClient.streamMessage(text, history)
    }
  },

  confirmBooking: (...args) =>
    tokenStore.get()
      ? httpClient.confirmBooking(...args)
      : mockClient.confirmBooking(...args),

  recordInventoryPurchase: (input) =>
    tokenStore.get()
      ? httpClient.recordInventoryPurchase(input)
      : mockClient.recordInventoryPurchase(input),

  getNudges: () =>
    tokenStore.get()
      ? httpClient.getNudges()
      : mockClient.getNudges(),

  dismissNudge: (id) =>
    tokenStore.get()
      ? httpClient.dismissNudge(id)
      : mockClient.dismissNudge(id),

  actOnNudge: (id) =>
    tokenStore.get()
      ? httpClient.actOnNudge(id)
      : mockClient.actOnNudge(id),
}
