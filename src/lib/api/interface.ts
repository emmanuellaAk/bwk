import type { Booking, BookingDraft, Nudge, StreamChunk } from './types'

export interface ApiClient {
  /** Stream a response to a user message, yielding token chunks + optional booking card */
  streamMessage(text: string): AsyncIterable<StreamChunk>

  /** Confirm a DRAFT booking → returns CONFIRMED booking */
  confirmBooking(bookingId: string, draft: BookingDraft): Promise<Booking>

  /** Fetch active (non-dismissed) nudges */
  getNudges(): Promise<Nudge[]>

  /** Dismiss a nudge without acting on it */
  dismissNudge(nudgeId: string): Promise<void>

  /** Act on a nudge (send reminder / place reorder) */
  actOnNudge(nudgeId: string): Promise<void>
}
