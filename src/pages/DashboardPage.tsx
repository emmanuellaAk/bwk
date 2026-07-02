import { colorHex, initials, cedi } from '@/lib/braider'
import { cn } from '@/lib/utils'
import type { Tab } from '@/components/layout/BottomNav'
import type { BookingRecord } from '@/lib/types'

const EARN_STATS = [
  { label: 'Today',       value: 'GH₵620',   delta: '2 appointments done', up: true  },
  { label: 'This week',   value: 'GH₵2,840', delta: '▲ 18% vs last week',  up: true  },
  { label: 'This month',  value: 'GH₵9,450', delta: '▲ 12% vs last month', up: true  },
  { label: 'Outstanding', value: 'GH₵380',   delta: '1 balance due',       up: false },
]

const APPOINTMENTS = [
  { name: 'Ama Mensah',    time: '9:00',  ampm: 'AM', style: 'Knotless Braids', color: 'Burgundy',      status: 'balance', price: 380, deposit: 120 },
  { name: 'Esi Boateng',   time: '11:30', ampm: 'AM', style: 'Boho Braids',     color: 'Natural Black', status: 'paid',    price: 420, deposit: 420 },
  { name: 'Abena Sarpong', time: '2:00',  ampm: 'PM', style: 'Fulani Braids',   color: 'Honey Blonde',  status: 'balance', price: 350, deposit: 100 },
]

const LOW_STOCK = [
  { name: 'Burgundy · 24″',   packs: 1, color: 'Burgundy'   },
  { name: 'Ombre Grey · 22″', packs: 2, color: 'Ombre Grey' },
]

const ArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
)
const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
)
const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
)

interface Props {
  onNavigate: (tab: Tab) => void
  bookings:   BookingRecord[]
}

export function DashboardPage({ onNavigate, bookings }: Props) {
  // dayIdx 1 = Tue Jul 14 (today in the demo)
  const newToday = bookings.filter(b => b.dayIdx === 1)
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-6 h-full overflow-y-auto bos-scroll" style={{ animation: 'bosUp 0.35s ease both' }}>

      {/* Page title */}
      <div className="mb-6">
        <div className="text-[12px] text-muted font-semibold mb-1">{today}</div>
        <h1 className="font-serif font-medium text-[28px] leading-tight text-ink m-0">
          Good afternoon, Kez
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {EARN_STATS.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              'rounded-[18px] p-[18px_16px]',
              i === 1
                ? 'bg-plum text-white'
                : 'bg-white border border-line'
            )}
          >
            <div className={cn('text-[11px] font-semibold mb-2', i === 1 ? 'text-white/70' : 'text-muted')}>
              {s.label}
            </div>
            <div className={cn('font-serif font-bold text-[22px] leading-none', i === 1 ? 'text-white' : 'text-ink')}>
              {s.value}
            </div>
            <div className={cn('text-[11px] font-medium mt-[7px]', i === 1 ? 'text-white/80' : s.up ? 'text-success' : 'text-draft')}>
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

        {/* Left: Today's appointments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[15px] text-ink m-0">
              Today · {APPOINTMENTS.length + newToday.length} appointments
            </h2>
            <button
              onClick={() => onNavigate('calendar')}
              className="flex items-center gap-1 text-plum text-[12.5px] font-semibold bg-transparent border-none cursor-pointer p-0 hover:opacity-75 transition-opacity"
            >
              Calendar <ArrowRight />
            </button>
          </div>

          <div className="flex flex-col gap-[9px]">
            {newToday.map(b => {
              const hex = colorHex(b.color)
              const bal = b.price - b.deposit
              const [t, ap] = b.time.split(' ')
              return (
                <div
                  key={b.id}
                  className="bg-plum-soft border border-plum/20 rounded-[16px] p-[14px_16px] flex items-center gap-4 shadow-[0_1px_6px_rgba(110,27,58,0.07)] cursor-pointer"
                >
                  <div className="text-center flex-none w-[46px]">
                    <div className="font-serif font-bold text-[15px] text-ink leading-none">{t}</div>
                    <div className="text-[10px] text-muted font-semibold mt-[3px]">{ap}</div>
                  </div>
                  <div className="w-px self-stretch bg-plum/20 flex-none" />
                  <span className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center text-white font-bold text-[14px] font-serif flex-none" style={{ background: hex }}>
                    {initials(b.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-ink leading-tight">{b.name}</div>
                    <div className="text-[12px] text-muted mt-[3px]">{b.service} · {b.color}</div>
                  </div>
                  <div className="text-right flex-none">
                    <div className="font-bold text-[14px] text-ink">{cedi(b.price)}</div>
                    <span className="inline-block text-[10.5px] font-bold px-[9px] py-[4px] rounded-[20px] mt-[4px] bg-draft-bg text-draft">
                      {cedi(bal)} due
                    </span>
                  </div>
                </div>
              )
            })}
            {APPOINTMENTS.map(a => {
              const hex = colorHex(a.color)
              const bal = a.price - a.deposit
              const isPaid = a.status === 'paid'
              return (
                <div
                  key={a.name}
                  className="bg-white border border-line rounded-[16px] p-[14px_16px] flex items-center gap-4 shadow-[0_1px_6px_rgba(110,27,58,0.05)] hover:shadow-[0_2px_12px_rgba(110,27,58,0.09)] transition-shadow cursor-pointer"
                >
                  {/* Time */}
                  <div className="text-center flex-none w-[46px]">
                    <div className="font-serif font-bold text-[15px] text-ink leading-none">{a.time}</div>
                    <div className="text-[10px] text-muted font-semibold mt-[3px]">{a.ampm}</div>
                  </div>

                  <div className="w-px self-stretch bg-line flex-none" />

                  {/* Avatar */}
                  <span
                    className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center text-white font-bold text-[14px] font-serif flex-none"
                    style={{ background: hex }}
                  >
                    {initials(a.name)}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-ink leading-tight">{a.name}</div>
                    <div className="text-[12px] text-muted mt-[3px]">{a.style} · {a.color}</div>
                  </div>

                  {/* Price + status */}
                  <div className="text-right flex-none">
                    <div className="font-bold text-[14px] text-ink">{cedi(a.price)}</div>
                    <span className={cn(
                      'inline-block text-[10.5px] font-bold px-[9px] py-[4px] rounded-[20px] mt-[4px]',
                      isPaid ? 'bg-success-bg text-success' : 'bg-plum-soft text-plum'
                    )}>
                      {isPaid ? 'Paid' : `${cedi(bal)} due`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick add row */}
          <button
            onClick={() => onNavigate('calendar')}
            className="mt-3 w-full flex items-center justify-center gap-2 text-muted text-[13px] font-semibold border border-dashed border-line rounded-[14px] py-[13px] bg-transparent cursor-pointer hover:bg-surface-2 hover:text-ink transition-colors"
          >
            + Add appointment
          </button>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Stock alerts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[15px] text-ink m-0 flex items-center gap-[7px]">
                <span className="text-draft"><AlertIcon /></span>
                Stock alerts
              </h2>
              <button
                onClick={() => onNavigate('inventory')}
                className="flex items-center gap-1 text-plum text-[12.5px] font-semibold bg-transparent border-none cursor-pointer p-0 hover:opacity-75 transition-opacity"
              >
                Inventory <ArrowRight />
              </button>
            </div>

            <div className="flex flex-col gap-[8px]">
              {LOW_STOCK.map(s => (
                <div
                  key={s.name}
                  className="bg-white border border-[rgba(181,118,42,0.25)] rounded-[15px] p-[13px_15px] flex items-center gap-3"
                >
                  <span
                    className="w-[10px] h-[10px] rounded-full border border-black/10 flex-none"
                    style={{ background: colorHex(s.color) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-ink">{s.name}</div>
                    <div className="text-[11px] text-draft font-semibold mt-[2px]">
                      {s.packs} pack{s.packs !== 1 ? 's' : ''} left · reorder soon
                    </div>
                  </div>
                  <button className="bg-plum text-white border-none h-[32px] px-[12px] rounded-[9px] text-[12px] font-bold cursor-pointer whitespace-nowrap flex-none">
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ask Kez AI */}
          <div
            className="bg-plum rounded-[18px] p-5 cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onNavigate('chat')}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-[38px] h-[38px] rounded-full bg-white/20 flex items-center justify-center flex-none">
                <span className="font-serif font-semibold text-[15px] text-white">K</span>
              </div>
              <div>
                <div className="font-bold text-[14px] text-white">Ask Kez AI</div>
                <div className="text-[11px] text-white/70 font-medium">Your braider assistant</div>
              </div>
            </div>
            <div className="flex flex-col gap-[7px]">
              {[
                'How much did I make this week?',
                'Who hasn\'t paid their deposit?',
                'What\'s low in stock?',
              ].map(q => (
                <div
                  key={q}
                  className="flex items-center gap-2 bg-white/10 rounded-[10px] px-[11px] py-[9px] text-[12px] text-white/90 font-medium"
                >
                  <span className="text-white/60 flex-none"><SparkleIcon /></span>
                  {q}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
