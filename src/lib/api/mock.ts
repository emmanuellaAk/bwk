import type { ApiClient } from './interface'
import type { Booking, BookingDraft, Nudge } from './types'

function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

let bookingCounter = 1
const bookingStore = new Map<string, Booking>()

const nudgeStore: Nudge[] = [
  {
    id: 'nudge-1',
    type: 'reminder',
    title: 'Appointment reminder due',
    body: "Esi Boateng's appointment is tomorrow at 2pm — no reminder sent yet.",
    primaryLabel: 'Send reminder',
    accent: '#6E1B3A',
    tint: '#F6E7EC',
    doneText: 'Reminder sent',
    dismissed: false,
    acted: false,
  },
  {
    id: 'nudge-2',
    type: 'reorder',
    title: 'Low stock: Honey Blonde 24″',
    body: 'Only 2 packs left. You have 3 appointments using this colour next week.',
    primaryLabel: 'Reorder 2 packs',
    accent: '#B5762A',
    tint: '#FBEFDD',
    doneText: 'Order placed',
    dismissed: false,
    acted: false,
  },
]

export const mockClient: ApiClient = {
  async *streamMessage(text) {
    const lower = text.toLowerCase()
    const isBookingPaste =
      lower.includes('ama') ||
      lower.includes('knotless') ||
      lower.includes('book') && lower.includes('name')

    if (isBookingPaste) {
      const intro =
        "I've parsed the message. Here's a booking draft for Ama Mensah — check the details and confirm when ready."
      for (const word of intro.split(' ')) {
        yield { token: word + ' ' }
        await delay(38)
      }

      const id = `booking-${bookingCounter++}`
      const booking: Booking = {
        id,
        status: 'DRAFT',
        draft: {
          name: 'Ama Mensah',
          style: 'Knotless Braids',
          date: 'Jul 25',
          time: '10:00 AM',
          color: 'Natural Black',
          price: 380,
          deposit: 120,
          notes: '',
        },
      }
      bookingStore.set(id, booking)
      yield { booking }
      yield { done: true }
    } else {
      const response =
        "Got it! I'll handle that for you. Let me know if you need anything else — bookings, reminders, or stock updates."
      for (const word of response.split(' ')) {
        yield { token: word + ' ' }
        await delay(42)
      }
      yield { done: true }
    }
  },

  async confirmBooking(bookingId: string, draft: BookingDraft) {
    await delay(600)
    const existing = bookingStore.get(bookingId)
    if (!existing) throw new Error(`Booking ${bookingId} not found`)
    const confirmed: Booking = {
      ...existing,
      status: 'CONFIRMED',
      draft,
      confirmedAt: new Date().toISOString(),
    }
    bookingStore.set(bookingId, confirmed)
    return confirmed
  },

  async getNudges() {
    await delay(300)
    return nudgeStore.filter(n => !n.dismissed)
  },

  async dismissNudge(nudgeId: string) {
    await delay(200)
    const nudge = nudgeStore.find(n => n.id === nudgeId)
    if (nudge) nudge.dismissed = true
  },

  async actOnNudge(nudgeId: string) {
    await delay(500)
    const nudge = nudgeStore.find(n => n.id === nudgeId)
    if (nudge) nudge.acted = true
  },
}
