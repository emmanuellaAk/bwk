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

function titleCase(value: string) {
  return value.trim().replace(/\b\w/g, letter => letter.toUpperCase())
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function shortDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function parseBookingFromText(text: string): Partial<BookingDraft> | null {
  const lower = text.toLowerCase()
  if (!/\b(book|schedule|appointment)\b/.test(lower)) return null

  const nameMatch = lower.match(/\bfor\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*)?)(?=\s+(?:on|at|for|who|she|he|,)|\s*$)/i)
  const name = nameMatch ? titleCase(nameMatch[1]) : 'New Client'

  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  const time = timeMatch
    ? `${timeMatch[1]}:${timeMatch[2] ?? '00'} ${timeMatch[3].toUpperCase()}`
    : '9:00 AM'

  const weekdayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/)
  let date = shortDate(addDays(new Date(), 1))
  if (weekdayMatch) {
    const weekday = weekdayMatch[1]
    const target = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(weekday)
    const today = new Date()
    const daysUntil = (target - today.getDay() + 7) % 7 || 7
    date = shortDate(addDays(today, daysUntil))
  } else {
    const dateMatch = lower.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\b/i)
    if (dateMatch) date = titleCase(`${dateMatch[1]} ${dateMatch[2]}`)
  }

  const priceMatch = lower.match(/(?:gh₵|ghs?)\s*(\d+(?:\.\d+)?)|\b(\d+(?:\.\d+)?)\s*(?:cedis?|ghs?|gh₵)\b/i)
  const price = priceMatch ? Number(priceMatch[1] ?? priceMatch[2]) : 350
  const locsMatch = lower.match(/\b((?:[a-z]+\s+)?locs?)\b/i)
  const serviceMatch = lower.match(/\b(?:braiding|braids?|doing)\s+(.+?)(?=\s+(?:on|at|and|for|everything)\b|\s*$)/i)
  const style = locsMatch ? titleCase(locsMatch[1]) : serviceMatch ? titleCase(serviceMatch[1]) : 'Knotless Braids'

  return {
    name,
    style,
    date,
    time,
    color: /\b(blonde|burgundy|brown|copper|pink|red)\b/i.test(style) ? titleCase(style.match(/\b(blonde|burgundy|brown|copper|pink|red)\b/i)?.[1] ?? 'Natural Black') : 'Natural Black',
    price,
    deposit: Math.round(price * 0.3),
    notes: locsMatch ? `Requested: ${locsMatch[1]}` : serviceMatch ? `Requested: ${serviceMatch[1]}` : '',
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
    "Low stock: Dark Brown 20″ (1 pack), Burgundy 24″ (1 pack), and Ombre Grey 22″ (2 packs).",

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

    const purchaseMatch = lower.match(/\bbought\s+(\d+)\s+(?:packs?|pacs?)\s+of\s+(.+?)\s+(?:and\s+)?(?:they\s+)?(?:were|cost|for)\s+(?:gh₵|ghs?\s*)?(\d+(?:\.\d+)?)\s*(?:cedis?|ghs?|gh₵)?\b/i)
    if (purchaseMatch) {
      yield* stream(`Inventory updated: ${purchaseMatch[1]} packs of ${titleCase(purchaseMatch[2])} added for GH₵${purchaseMatch[3]} total.`)
      yield { done: true }
      return
    }

    // Try to parse a booking from free text
    if (intent === 'booking_intent' || intent === 'fallback') {
      const draft = parseBookingFromText(text)
      if (draft) {
        const intro = `Booking draft ready for ${draft.name}.`
        yield* stream(intro)
        const id = `booking-${bookingCounter++}`
        const booking: Booking = {
          id, status: 'DRAFT',
          draft: draft as BookingDraft,
        }
        bookingStore.set(id, booking)
        yield { booking }
        if (/\b(available|availability|open slots?|rest of the available dates?)\b/.test(lower)) {
          yield {
            avail: {
              title: 'Other open slots',
              body: 'Mon 11:00 AM · Tue 12:30 PM · Thu 2:30 PM · Fri 1:00 PM',
            },
          }
        }
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
      yield* stream('Today\'s appointments and this week\'s open slots:')
      yield {
        avail: {
          title: 'Today + open slots',
          body: 'Today: Ama Mensah at 9:00 AM. Open slots: Mon 11:00 AM · Tue 12:30 PM · Thu 2:30 PM · Fri 1:00 PM.',
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

  async recordInventoryPurchase() {},

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
