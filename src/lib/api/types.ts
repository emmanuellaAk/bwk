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

export interface StreamChunk {
  token?: string
  booking?: Booking
  done?: boolean
}
