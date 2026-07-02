import type { ApiClient } from './interface'
import type { Booking, BookingDraft, Nudge } from './types'

function delay(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

async function* stream(text: string, wpm = 220) {
  const words = text.split(' ')
  const msPerWord = 60_000 / wpm
  for (const word of words) {
    yield { token: word + ' ' }
    await delay(msPerWord * (0.6 + Math.random() * 0.8))
  }
}

let bookingCounter = 1
const bookingStore = new Map<string, Booking>()

const nudgeStore: Nudge[] = [
  {
    id: 'nudge-1', type: 'reminder',
    title: 'Appointment reminder due',
    body: "Esi Boateng's appointment is tomorrow at 2pm — no reminder sent yet.",
    primaryLabel: 'Send reminder', accent: '#6E1B3A', tint: '#F6E7EC',
    doneText: 'Reminder sent ✓', dismissed: false, acted: false,
  },
  {
    id: 'nudge-2', type: 'reorder',
    title: 'Low stock: Honey Blonde 24″',
    body: 'Only 2 packs left. You have 3 appointments using this colour next week.',
    primaryLabel: 'Reorder now', accent: '#B5762A', tint: '#FBEFDD',
    doneText: 'Order placed ✓', dismissed: false, acted: false,
  },
]

/* ── intent matcher ── */
function classify(q: string): string {
  const t = q.toLowerCase()
  if (/how much|revenue|earn|mak(e|ing)|money|profit|income/.test(t)) return 'revenue'
  if (/this week|weekly/.test(t) && /earn|revenue|mak/.test(t))       return 'revenue_week'
  if (/today|appointment.*(today)|schedule/.test(t))                   return 'today'
  if (/tomorrow/.test(t))                                              return 'tomorrow'
  if (/pay|balance|owe|deposit|outstanding/.test(t))                   return 'outstanding'
  if (/top client|best client|vip/.test(t))                            return 'top_client'
  if (/client|customer|how many/.test(t))                              return 'clients'
  if (/stock|low|reorder|packs|inventory/.test(t))                     return 'stock'
  if (/remind(er)?/.test(t))                                           return 'reminder'
  if (/book|schedul|appoint/.test(t))                                  return 'booking_intent'
  if (/supplier|order|buy|purchase/.test(t))                           return 'supplier'
  if (/hi|hello|hey|morning|afternoon|evening/.test(t))                return 'greeting'
  return 'fallback'
}

function parseBookingFromText(text: string): Partial<BookingDraft> | null {
  const t = text.toLowerCase()
  const names = ['ama mensah', 'esi owusu', 'abena sarpong', 'akua darko', 'nana adjei']
  const name = names.find(n => t.includes(n.split(' ')[0].toLowerCase()))
  const styles = ['knotless braids', 'boho braids', 'goddess braids', 'cornrows', 'fulani braids', 'box braids']
  const style = styles.find(s => t.includes(s.split(' ')[0]))
  if (!name && !style) return null
  return {
    name:    name ? name.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : 'New Client',
    style:   style ? style.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : 'Knotless Braids',
    date:    'Jul 20',
    time:    '10:00 AM',
    color:   'Natural Black',
    price:   350,
    deposit: 105,
    notes:   '',
  }
}

const RESPONSES: Record<string, string> = {
  greeting:
    "Hey Kez! 👋 You've got 3 appointments today and GH₵2,840 earned this week. Anything specific you'd like to check on?",

  revenue:
    "This month you've made **GH₵9,450** in revenue — up 6.2% from last month. Expenses came in at GH₵1,620, leaving a profit of **GH₵7,830**.\n\nYour strongest week was Jul 7–11 with GH₵2,840 across 8 appointments. Average per appointment: GH₵385.",

  revenue_week:
    "This week you've made **GH₵2,840** across 8 appointments — that's 18% up on last week. Average per service is GH₵355.",

  today:
    "You have **3 appointments** today (Tue, Jul 14):\n\n• 9:00 AM — Ama Mensah · Knotless Braids · GH₵350 (GH₵260 balance due)\n• 11:30 AM — Esi Boateng · Boho Braids · GH₵420 (paid)\n• 2:00 PM — Abena Sarpong · Fulani Braids · GH₵380 (GH₵280 balance due)\n\nTotal if all pay up today: GH₵1,150.",

  tomorrow:
    "Tomorrow (Wed, Jul 15) you have **1 appointment**:\n\n• 10:00 AM — Maame Osei · Knotless Braids · GH₵350\n\nRest of the day is open — worth taking a walk-in or blocking personal time.",

  outstanding:
    "Two clients have outstanding balances:\n\n• **Ama Mensah** — GH₵260 for Knotless Braids\n• **Abena Sarpong** — GH₵250 for Fulani Braids\n\nThere's also a **supplier invoice** from Royal Hair Supplies — GH₵600 (Invoice #0041, Jul 10).\n\nTotal outstanding: **GH₵1,110**. Want me to draft a WhatsApp reminder to the clients?",

  top_client:
    "Your top client is **Abena Sarpong** — GH₵1,480 spent across 6 visits. She brings consistent referrals too. Her favourite colour is Honey Blonde and she always books Knotless or Fulani Braids.\n\nConsider offering her a loyalty reward on her next visit — it keeps regulars coming back.",

  clients:
    "You have **48 clients** in your book, 5 active this month. Your most loyal this quarter are Abena Sarpong (6 visits), Ama Mensah (5 visits), and Esi Owusu (4 visits).\n\nAverage client lifetime value: GH₵966.",

  stock:
    "You have **3 items running low** right now:\n\n• Dark Brown 20″ — 1 pack left ⚠️\n• Burgundy 24″ — 1 pack left ⚠️\n• Ombre Grey 22″ — 2 packs left\n\nRoyal Hair Supplies is your main supplier. Want me to put together a reorder list?",

  reminder:
    "I can send a WhatsApp reminder to any client. Who should I remind — Ama Mensah about tomorrow's balance, or Esi Boateng about today's appointment?\n\nJust say the name and I'll draft it.",

  booking_intent:
    "Sure! To create a booking I need: **client name**, **service**, **date & time**, and **hair colour**. You can type it naturally — like \"Book Ama Mensah for Knotless Braids, Jul 20 at 10am, Natural Black\" — and I'll parse it.",

  supplier:
    "Your main supplier is **Royal Hair Supplies** (Accra) — GH₵3,840 spent across 11 orders. You have an outstanding invoice with them for GH₵600.\n\nAkosombo Braids Co in Kumasi is your secondary supplier — useful for Burgundy and Copper shades.\n\nNeed me to draft a new order?",

  fallback:
    "I can help you with bookings, client info, revenue, stock levels, and reminders. Try asking things like:\n\n• \"How much did I make this week?\"\n• \"Who hasn't paid their deposit?\"\n• \"What's low in stock?\"\n• \"Book Ama for Knotless Braids Jul 20\"\n• \"Who are my top clients?\"",
}

export const mockClient: ApiClient = {
  async *streamMessage(text) {
    const lower = text.toLowerCase()
    const intent = classify(text)

    // Try to parse a booking from free text
    if (intent === 'booking_intent' || intent === 'fallback') {
      const draft = parseBookingFromText(text)
      if (draft) {
        const intro = `Got it! Here's a booking draft for ${draft.name} — review the details and confirm when you're ready.`
        yield* stream(intro)
        const id = `booking-${bookingCounter++}`
        const booking: Booking = {
          id, status: 'DRAFT',
          draft: draft as BookingDraft,
        }
        bookingStore.set(id, booking)
        yield { booking }
        yield { done: true }
        return
      }
    }

    // Emit rich cards for certain intents after streaming text
    if (intent === 'revenue' || intent === 'revenue_week') {
      const intro = intent === 'revenue_week'
        ? 'Here\'s your week at a glance:'
        : 'Here\'s your earnings summary for this week:'
      yield* stream(intro)
      yield {
        earnings: {
          delta: '18%', revenue: 'GH₵2,840', expenses: 'GH₵420',
          completed: 8, profit: 'GH₵2,420',
        },
      }
      yield { done: true }
      return
    }

    if (intent === 'today') {
      yield* stream('Here\'s what today looks like:')
      yield {
        avail: {
          title: 'Tue, Jul 14 — 3 appointments',
          body: '9:00 AM · Ama Mensah  ·  11:30 AM · Esi Boateng  ·  2:00 PM · Abena Sarpong',
        },
      }
      yield { done: true }
      return
    }

    if (/available|free slot|open slot|when.*free/.test(lower)) {
      yield* stream('Yes, you have open slots this week:')
      yield {
        avail: {
          title: 'Open slots available',
          body: 'Mon 11:00 AM · Tue 12:30 PM · Thu 2:30 PM · Fri 1:00 PM',
        },
      }
      yield { done: true }
      return
    }

    const response = RESPONSES[intent] ?? RESPONSES.fallback
    const clean = response.replace(/\*\*/g, '')
    yield* stream(clean)
    yield { done: true }
  },

  async confirmBooking(bookingId: string, draft: BookingDraft) {
    await delay(600)
    const existing = bookingStore.get(bookingId)
    if (!existing) throw new Error(`Booking ${bookingId} not found`)
    const confirmed: Booking = { ...existing, status: 'CONFIRMED', draft, confirmedAt: new Date().toISOString() }
    bookingStore.set(bookingId, confirmed)
    return confirmed
  },

  async getNudges() {
    await delay(200)
    return nudgeStore.filter(n => !n.dismissed)
  },

  async dismissNudge(nudgeId: string) {
    await delay(150)
    const n = nudgeStore.find(n => n.id === nudgeId)
    if (n) n.dismissed = true
  },

  async actOnNudge(nudgeId: string) {
    await delay(400)
    const n = nudgeStore.find(n => n.id === nudgeId)
    if (n) n.acted = true
  },
}
