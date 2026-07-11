import { mockClient } from './mock'
import { httpClient } from './http'
import { tokenStore } from './token'
import type { ApiClient } from './interface'
import type { ChatEntry } from './types'

// Route to real API when authenticated, mock otherwise
export const apiClient: ApiClient = {
  async *streamMessage(text: string, history: readonly ChatEntry[]) {
    if (tokenStore.get()) {
      yield* httpClient.streamMessage(text, history)
    } else {
      yield* mockClient.streamMessage(text, history)
    }
  },

  confirmBooking: (...args) =>
    tokenStore.get()
      ? httpClient.confirmBooking(...args)
      : mockClient.confirmBooking(...args),

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
