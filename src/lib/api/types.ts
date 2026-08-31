export interface BookingDraft {
  name: string
  style: string
  date: string
  time: string
  color: string
  price: number
  deposit: number
  notes: string
}

export type BookingStatus = 'DRAFT' | 'CONFIRMED'

export interface Booking {
  id: string
  status: BookingStatus
  draft: BookingDraft
  confirmedAt?: string
}

export type NudgeType = 'reminder' | 'reorder'

export interface Nudge {
  id: string
  type: NudgeType
  title: string
  body: string
  primaryLabel: string
  accent: string
  tint: string
  doneText: string
  dismissed: boolean
  acted: boolean
}

export interface EarningsChunk {
  delta: string; revenue: string; expenses: string; completed: number; profit: string
}
export interface AvailChunk { title: string; body: string }

export interface ChatEntry {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
  // A card-only reply (earnings/schedule/inventory/booking) streams no token
  // text at all — these carry what was actually shown, so history sent back
  // to the model reflects it instead of looking like an unanswered turn.
  booking?: Booking
  earnings?: EarningsChunk
  avail?: AvailChunk
}

export interface StreamChunk {
  token?: string
  booking?: Booking
  earnings?: EarningsChunk
  avail?: AvailChunk
  done?: boolean
}
