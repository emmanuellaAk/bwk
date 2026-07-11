import type { Booking, BookingDraft, Nudge, StreamChunk, ChatEntry } from './types'

export interface ApiClient {
  /** Stream a response to a user message. History is prior messages for context. */
  streamMessage(text: string, history: readonly ChatEntry[]): AsyncIterable<StreamChunk>

  /** Confirm a DRAFT booking → returns CONFIRMED booking */
  confirmBooking(bookingId: string, draft: BookingDraft): Promise<Booking>

  /** Fetch active (non-dismissed) nudges */
  getNudges(): Promise<Nudge[]>

  /** Dismiss a nudge without acting on it */
  dismissNudge(nudgeId: string): Promise<void>

  /** Act on a nudge (send reminder / place reorder) */
  actOnNudge(nudgeId: string): Promise<void>
}
