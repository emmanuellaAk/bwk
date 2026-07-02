import { useState } from 'react'
import { colorHex, initials, cedi } from '@/lib/braider'
import { cn } from '@/lib/utils'
import type { Tab } from '@/components/layout/BottomNav'

interface HistoryEntry { date: string; style: string; amt: number }
interface Client {
  name: string; phone: string; fav: string; spent: number
  visits: number; last: string; notes: string; history: HistoryEntry[]
}

const CLIENTS: Client[] = [
  {
    name: 'Abena Sarpong', phone: '+233 27 332 5567', fav: 'Dark Brown', spent: 1480, visits: 6, last: 'Knotless Braids',
    notes: 'VIP — refers many friends. Always offer water and the good playlist.',
    history: [
      { date: 'Jul 6, 2026',  style: 'Knotless Braids', amt: 350 },
      { date: 'May 20, 2026', style: 'Goddess Braids',  amt: 450 },
      { date: 'Apr 2, 2026',  style: 'Boho Braids',     amt: 420 },
      { date: 'Feb 14, 2026', style: 'Cornrows',         amt: 160 },
    ],
  },
  {
    name: 'Ama Mensah', phone: '+233 24 555 0142', fav: 'Burgundy', spent: 1250, visits: 5, last: 'Medium Knotless',
    notes: 'Tender-headed — work gently around the edges. Loves curly ends.',
    history: [
      { date: 'Jul 15, 2026', style: 'Medium Knotless', amt: 350 },
      { date: 'May 2, 2026',  style: 'Boho Braids',     amt: 420 },
      { date: 'Mar 18, 2026', style: 'Knotless',         amt: 300 },
      { date: 'Jan 9, 2026',  style: 'Cornrows',         amt: 180 },
    ],
  },
  {
    name: 'Esi Owusu', phone: '+233 20 441 8890', fav: 'Honey Blonde', spent: 980, visits: 4, last: 'Boho Braids',
    notes: 'Prefers waist length. Usually books weekends.',
    history: [
      { date: 'Jul 18, 2026', style: 'Boho Braids', amt: 420 },
      { date: 'Apr 28, 2026', style: 'Knotless',    amt: 300 },
      { date: 'Feb 9, 2026',  style: 'Ponytail',    amt: 200 },
      { date: 'Dec 3, 2025',  style: 'Cornrows',    amt: 160 },
    ],
  },
  {
    name: 'Nana Adjei', phone: '+233 24 909 1123', fav: 'Copper', spent: 760, visits: 3, last: 'Goddess Braids',
    notes: 'Loves bold colours and statement looks.',
    history: [
      { date: 'Jun 22, 2026', style: 'Goddess Braids', amt: 450 },
      { date: 'Mar 30, 2026', style: 'Boho Braids',    amt: 420 },
      { date: 'Jan 15, 2026', style: 'Knotless',       amt: 300 },
    ],
  },
  {
    name: 'Akua Darko', phone: '+233 26 778 2210', fav: 'Natural Black', spent: 540, visits: 3, last: 'Cornrows',
    notes: 'Feed-in, straight back. Quick, no-fuss sessions.',
    history: [
      { date: 'Jul 16, 2026', style: 'Cornrows', amt: 180 },
      { date: 'May 11, 2026', style: 'Ponytail', amt: 200 },
      { date: 'Mar 4, 2026',  style: 'Cornrows', amt: 160 },
    ],
  },
]

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
  </svg>
)
const ChevronLeft = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
)

export function ClientsPage({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [search, setSearch]       = useState('')
  const [selectedIdx, setSelected] = useState<number | null>(null)
  const [toast, setToast]         = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const filtered = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.last.toLowerCase().includes(search.toLowerCase())
  )

  const client = selectedIdx !== null ? CLIENTS[selectedIdx] : null

  return (
    <div className="flex h-full overflow-hidden relative" style={{ animation: 'bosUp 0.35s ease both' }}>
      {toast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-[13px] font-semibold px-5 py-3 rounded-[12px] shadow-lg" style={{ animation: 'bosUp 0.25s ease both' }}>
          {toast}
        </div>
      )}

      {/* ── Left: client list ── */}
      <div className={cn(
        'flex flex-col border-r border-line bg-surface overflow-y-auto bos-scroll flex-none',
        // On mobile, hide list when detail is open
        selectedIdx !== null ? 'hidden lg:flex lg:w-[340px]' : 'w-full lg:w-[340px]'
      )}>
        <div className="p-5 pb-3">
          <h1 className="font-serif font-medium text-[24px] text-ink m-0 mb-[3px]">Customers</h1>
          <div className="text-[12px] text-muted font-semibold mb-4">48 total · {CLIENTS.length} shown</div>

          {/* Search */}
          <div className="flex items-center gap-[9px] bg-white border border-line rounded-[14px] px-[14px] py-[11px] mb-1">
            <span className="text-muted flex-none"><SearchIcon /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="flex-1 border-none outline-none bg-transparent text-[13.5px] text-ink placeholder:text-muted"
            />
          </div>
        </div>

        {/* Client list */}
        <div className="flex flex-col gap-[9px] px-5 pb-5">
          {filtered.map((c) => {
            const hex = colorHex(c.fav)
            const realIdx = CLIENTS.indexOf(c)
            return (
              <button
                key={c.name}
                onClick={() => setSelected(realIdx)}
                className={cn(
                  'flex items-center gap-3 bg-white border rounded-[16px] px-[14px] py-[13px] cursor-pointer text-left w-full shadow-[0_2px_10px_rgba(110,27,58,0.04)] transition-all',
                  selectedIdx === realIdx ? 'border-plum bg-plum-soft' : 'border-line hover:border-plum/30'
                )}
              >
                <span
                  className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center text-white font-bold text-[15px] font-serif flex-none"
                  style={{ background: hex }}
                >
                  {initials(c.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px] text-ink">{c.name}</div>
                  <div className="text-[11.5px] text-muted mt-[2px]">{c.visits} visits · last: {c.last}</div>
                </div>
                <div className="text-right flex-none">
                  <div className="font-bold text-[13.5px] font-serif text-ink">{cedi(c.spent)}</div>
                  <div className="text-[10px] text-muted">total spent</div>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted text-[13px]">No clients found</div>
          )}
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      <div className={cn(
        'flex-1 overflow-y-auto bos-scroll',
        selectedIdx === null ? 'hidden lg:flex lg:flex-col lg:items-center lg:justify-center' : 'flex flex-col'
      )}>
        {client === null ? (
          <div className="text-center p-8">
            <div className="text-[40px] mb-3">👤</div>
            <div className="font-serif text-[18px] font-medium text-ink mb-1">Select a customer</div>
            <div className="text-[12.5px] text-muted">Click a name on the left to see their profile</div>
          </div>
        ) : (
          <ClientDetail
            client={client}
            onBack={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  )
}

function ClientDetail({ client: c, onBack }: { client: Client; onBack: () => void }) {
  const hex = colorHex(c.fav)
  const styleChips = [...new Set(c.history.map(h => h.style))]

  return (
    <div className="p-[22px_24px] w-full">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-[6px] bg-transparent border-none text-plum text-[13px] font-semibold cursor-pointer p-0 mb-[14px] hover:opacity-75 transition-opacity"
      >
        <ChevronLeft /> All customers
      </button>

      {/* Header */}
      <div className="flex items-center gap-[14px] mb-[18px]">
        <span
          className="w-[64px] h-[64px] rounded-[20px] flex items-center justify-center text-white font-bold text-[22px] font-serif flex-none"
          style={{ background: hex }}
        >
          {initials(c.name)}
        </span>
        <div>
          <h1 className="font-serif font-medium text-[23px] m-0 text-ink">{c.name}</h1>
          <div className="text-[12.5px] text-muted mt-[3px]">{c.phone}</div>
          <div className="inline-flex items-center gap-[6px] mt-[7px] bg-plum-soft px-[10px] py-[4px] rounded-[20px] text-[11px] font-semibold text-plum">
            <span className="w-[10px] h-[10px] rounded-full flex-none" style={{ background: hex }} />
            Favourite: {c.fav}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left col: stats + styles + notes + actions */}
        <div>
          <div className="grid grid-cols-2 gap-[10px] mb-[18px]">
            <div className="bg-plum text-white rounded-[16px] p-[14px]">
              <div className="text-[11px] opacity-80 font-semibold">Total spent</div>
              <div className="font-serif font-bold text-[22px] mt-1">{cedi(c.spent)}</div>
            </div>
            <div className="bg-white border border-line rounded-[16px] p-[14px]">
              <div className="text-[11px] text-muted font-semibold">Appointments</div>
              <div className="font-serif font-bold text-[22px] text-ink mt-1">{c.visits}</div>
            </div>
          </div>

          <h2 className="text-[14px] font-bold m-0 mb-[9px] text-ink">Past styles</h2>
          <div className="flex flex-wrap gap-[7px] mb-[18px]">
            {styleChips.map(s => (
              <span key={s} className="bg-surface-2 border border-line px-[12px] py-[7px] rounded-[20px] text-[12px] font-semibold text-ink">
                {s}
              </span>
            ))}
          </div>

          <div className="bg-surface-2 rounded-[16px] p-[14px] mb-[18px]">
            <div className="text-[12px] font-bold text-plum mb-[6px]">📝 Notes</div>
            <div className="text-[13px] leading-[1.5] text-ink">{c.notes}</div>
          </div>

          <div className="flex gap-[9px]">
            <button
              className="flex-1 bg-plum text-white border-none h-[46px] rounded-[14px] text-[13.5px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onNavigate('chat')}
            >
              Book appointment
            </button>
            <a
              href={`https://wa.me/${(client?.phone ?? '').replace(/\s+/g, '').replace(/^\+/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex-none bg-plum-soft text-plum no-underline h-[46px] px-[20px] rounded-[14px] text-[13.5px] font-semibold cursor-pointer hover:opacity-80 transition-opacity flex items-center"
            >
              Message
            </a>
          </div>
        </div>

        {/* Right col: appointment history */}
        <div>
          <h2 className="text-[14px] font-bold m-0 mb-[11px] text-ink">Appointment history</h2>
          <div className="flex flex-col gap-[8px]">
            {c.history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-line rounded-[14px] px-[14px] py-[12px]">
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: hex }} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] text-ink">{h.style}</div>
                  <div className="text-[11px] text-muted mt-[1px]">{h.date}</div>
                </div>
                <div className="font-bold text-[13px] font-serif text-ink">{cedi(h.amt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
