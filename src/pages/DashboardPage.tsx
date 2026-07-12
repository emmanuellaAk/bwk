import { useMemo } from 'react'
import { colorHex, initials, cedi } from '@/lib/braider'
import { cn } from '@/lib/utils'
import { useAppointments } from '@/lib/api/hooks/useAppointments'
import { tokenStore } from '@/lib/api/token'
import type { AppointmentRecord } from '@/lib/api/hooks/useAppointments'
import type { Tab } from '@/components/layout/BottomNav'

const EARN_STATS = [
  { label: 'Today',       value: 'GH₵620',   delta: '2 appointments done', up: true  },
  { label: 'This week',   value: 'GH₵2,840', delta: '▲ 18% vs last week',  up: true  },
  { label: 'This month',  value: 'GH₵9,450', delta: '▲ 12% vs last month', up: true  },
  { label: 'Outstanding', value: 'GH₵380',   delta: '1 balance due',       up: false },
]

// Demo appointments shown before the backend is connected
const DEMO_APPOINTMENTS = [
  { name: 'Ama Mensah',    time: '9:00',  ampm: 'AM', style: 'Knotless Braids', colorHex: colorHex('Burgundy'),      price: 380, deposit: 120 },
  { name: 'Esi Boateng',   time: '11:30', ampm: 'AM', style: 'Boho Braids',     colorHex: colorHex('Natural Black'), price: 420, deposit: 420 },
  { name: 'Abena Sarpong', time: '2:00',  ampm: 'PM', style: 'Fulani Braids',   colorHex: colorHex('Honey Blonde'),  price: 350, deposit: 100 },
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

function fmtApptTime(isoStr: string): { t: string; ap: string } {
  const d = new Date(isoStr)
  const h = d.getHours()
  const m = d.getMinutes()
  const h12 = h % 12 || 12
  const t = m === 0 ? `${h12}:00` : `${h12}:${m.toString().padStart(2, '0')}`
  return { t, ap: h < 12 ? 'AM' : 'PM' }
}

interface Props {
  onNavigate: (tab: Tab) => void
}

export function DashboardPage({ onNavigate }: Props) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const todayEnd = useMemo(() => {
    const d = new Date()
    d.setHours(23, 59, 59, 999)
    return d
  }, [])

  const { data: todayAppts, isLoading: apptLoading } = useAppointments(todayStart, todayEnd)
  const hasToken = !!tokenStore.get()
  const showApi  = hasToken && !apptLoading

  const apiAppts: AppointmentRecord[] = todayAppts ?? []
  const totalCount = showApi ? apiAppts.length : DEMO_APPOINTMENTS.length

  return (
    <div className="p-6 h-full overflow-y-auto bos-scroll" style={{ animation: 'bosUp 0.35s ease both' }}>

      {/* Page title */}
      <div className="mb-6">
        <div className="text-[12px] text-muted font-semibold mb-1">{today}</div>
        <h1 className="font-serif font-medium text-[28px] leading-tight text-ink m-0">
          Good morning, Kez
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {EARN_STATS.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              'rounded-[18px] p-[18px_16px]',
              i === 1 ? 'bg-plum text-white' : 'bg-white border border-line'
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
              Today · {totalCount} appointment{totalCount !== 1 ? 's' : ''}
            </h2>
            <button
              onClick={() => onNavigate('calendar')}
              className="flex items-center gap-1 text-plum text-[12.5px] font-semibold bg-transparent border-none cursor-pointer p-0 hover:opacity-75 transition-opacity"
            >
              Calendar <ArrowRight />
            </button>
          </div>

          <div className="flex flex-col gap-[9px]">
            {/* Loading skeleton */}
            {hasToken && apptLoading && [1, 2, 3].map(i => (
              <div key={i} className="h-[72px] bg-surface-2 rounded-[16px] animate-pulse" />
            ))}

            {/* API appointments */}
            {showApi && apiAppts.map(a => {
              const { t, ap } = fmtApptTime(a.starts_at)
              const bal = a.total_price - a.deposit_paid
              const isPaid = bal <= 0
              return (
                <div
                  key={a.id}
                  className="bg-white border border-line rounded-[16px] p-[14px_16px] flex items-center gap-4 shadow-[0_1px_6px_rgba(110,27,58,0.05)] hover:shadow-[0_2px_12px_rgba(110,27,58,0.09)] transition-shadow cursor-pointer"
                >
                  <div className="text-center flex-none w-[46px]">
                    <div className="font-serif font-bold text-[15px] text-ink leading-none">{t}</div>
                    <div className="text-[10px] text-muted font-semibold mt-[3px]">{ap}</div>
                  </div>
                  <div className="w-px self-stretch bg-line flex-none" />
                  <span
                    className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center text-white font-bold text-[14px] font-serif flex-none"
                    style={{ background: a.color_hex }}
                  >
                    {initials(a.client_name ?? '?')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-ink leading-tight">{a.client_name ?? 'Client'}</div>
                    <div className="text-[12px] text-muted mt-[3px]">
                      {a.service_name ?? a.notes ?? ''}
                      {a.status === 'pending' && (
                        <span className="ml-2 text-[10px] font-bold bg-draft-bg text-draft px-[6px] py-[2px] rounded-full">PENDING</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-none">
                    <div className="font-bold text-[14px] text-ink">{cedi(a.total_price)}</div>
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

            {/* Demo appointments shown before API is connected */}
            {!hasToken && DEMO_APPOINTMENTS.map(a => {
              const bal = a.price - a.deposit
              const isPaid = bal <= 0
              return (
                <div
                  key={a.name}
                  className="bg-white border border-line rounded-[16px] p-[14px_16px] flex items-center gap-4 shadow-[0_1px_6px_rgba(110,27,58,0.05)] hover:shadow-[0_2px_12px_rgba(110,27,58,0.09)] transition-shadow cursor-pointer"
                >
                  <div className="text-center flex-none w-[46px]">
                    <div className="font-serif font-bold text-[15px] text-ink leading-none">{a.time}</div>
                    <div className="text-[10px] text-muted font-semibold mt-[3px]">{a.ampm}</div>
                  </div>
                  <div className="w-px self-stretch bg-line flex-none" />
                  <span
                    className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center text-white font-bold text-[14px] font-serif flex-none"
                    style={{ background: a.colorHex }}
                  >
                    {initials(a.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-ink leading-tight">{a.name}</div>
                    <div className="text-[12px] text-muted mt-[3px]">{a.style}</div>
                  </div>
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

            {/* Empty state when logged in but no appointments today */}
            {showApi && apiAppts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2 bg-surface-2 rounded-[16px]">
                <div className="text-[28px]">🗓️</div>
                <div className="text-[13px] font-semibold text-ink">No appointments today</div>
                <div className="text-[12px] text-muted">Your schedule is clear</div>
              </div>
            )}
          </div>

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
