import { useState } from 'react'
import { cn } from '@/lib/utils'
import { initials, colorHex } from '@/lib/braider'
import type { BookingRecord } from '@/lib/types'

type View = 'day' | 'week' | 'month'
type Kind = 'confirmed' | 'available' | 'blocked'

const CAL_WEEK = [
  { d: 'Mon', n: 13 },
  { d: 'Tue', n: 14, today: true },
  { d: 'Wed', n: 15 },
  { d: 'Thu', n: 16 },
  { d: 'Fri', n: 17 },
  { d: 'Sat', n: 18 },
]

const ALL_EVENTS: { time: string; name: string; style: string; kind: Kind; dayIdx: number }[] = [
  { time: '9:00',  name: 'Ama Mensah',   style: 'Medium Knotless',        kind: 'confirmed', dayIdx: 0 },
  { time: '11:00', name: 'Open slot',    style: 'Available for booking',  kind: 'available', dayIdx: 0 },
  { time: '3:00',  name: 'Blocked',      style: 'Supply run',             kind: 'blocked',   dayIdx: 0 },
  { time: '9:00',  name: 'Esi Owusu',    style: 'Boho Braids',            kind: 'confirmed', dayIdx: 1 },
  { time: '12:30', name: 'Open slot',    style: 'Available for booking',  kind: 'available', dayIdx: 1 },
  { time: '2:00',  name: 'Akua Darko',   style: 'Cornrows',               kind: 'confirmed', dayIdx: 1 },
  { time: '5:00',  name: 'Open slot',    style: 'Available for booking',  kind: 'available', dayIdx: 1 },
  { time: '10:00', name: 'Maame Osei',   style: 'Knotless Braids',        kind: 'confirmed', dayIdx: 2 },
  { time: '1:00',  name: 'Blocked',      style: 'Lunch & restock',        kind: 'blocked',   dayIdx: 2 },
  { time: '10:00', name: 'Abena Sarpong',style: 'Fulani Braids',          kind: 'confirmed', dayIdx: 3 },
  { time: '2:30',  name: 'Open slot',    style: 'Available for booking',  kind: 'available', dayIdx: 3 },
  { time: '9:30',  name: 'Efua Darko',   style: 'Senegalese Twist',       kind: 'confirmed', dayIdx: 4 },
  { time: '1:00',  name: 'Open slot',    style: 'Available for booking',  kind: 'available', dayIdx: 4 },
  { time: '3:30',  name: 'Blocked',      style: 'Personal time',          kind: 'blocked',   dayIdx: 4 },
  { time: '9:00',  name: 'Ama Mensah',   style: 'Knotless Braids',        kind: 'confirmed', dayIdx: 5 },
  { time: '12:30', name: 'Esi Boateng',  style: 'Boho Braids',            kind: 'confirmed', dayIdx: 5 },
  { time: '2:00',  name: 'Blocked',      style: 'Lunch & restock',        kind: 'blocked',   dayIdx: 5 },
  { time: '3:00',  name: 'Akua Asante',  style: 'Box Braids',             kind: 'confirmed', dayIdx: 5 },
]

const KIND: Record<Kind, { bg: string; bar: string; text: string; nameColor: string; dot: string }> = {
  confirmed: { bg: 'bg-plum-soft',  bar: 'border-l-plum',    text: 'text-plum',    nameColor: 'text-ink',     dot: 'bg-plum'    },
  available: { bg: 'bg-success-bg', bar: 'border-l-success', text: 'text-success', nameColor: 'text-success', dot: 'bg-success' },
  blocked:   { bg: 'bg-surface-2',  bar: 'border-l-muted',   text: 'text-muted',   nameColor: 'text-muted',   dot: 'bg-muted'   },
}

const LEGEND: { label: string; kind: Kind }[] = [
  { label: 'Confirmed', kind: 'confirmed' },
  { label: 'Available', kind: 'available' },
  { label: 'Blocked',   kind: 'blocked'   },
]

const WEEK_STATS = [
  { label: 'Appointments', value: '8' },
  { label: 'Revenue',      value: 'GH₵2,840' },
  { label: 'Open slots',   value: '4' },
]

export function CalendarPage({ bookings = [] }: { bookings?: BookingRecord[] }) {
  const [view, setView] = useState<View>('week')
  const [selectedDay, setSelectedDay] = useState(1) // Tue = today
  const [activeFilters, setActiveFilters] = useState<Set<Kind>>(new Set(['confirmed', 'available', 'blocked']))

  // Convert live bookings into calendar events
  const liveEvents = bookings.map(b => ({
    time:   b.time.replace(' AM', '').replace(' PM', ''),
    name:   b.name,
    style:  b.service,
    kind:   'confirmed' as Kind,
    dayIdx: b.dayIdx,
    colorHex: colorHex(b.color),
    initials: initials(b.name),
    isLive: true,
  }))

  const allEvents = [
    ...ALL_EVENTS.map(e => ({ ...e, colorHex: undefined as string | undefined, initials: undefined as string | undefined, isLive: false })),
    ...liveEvents,
  ]

  const toggleFilter = (kind: Kind) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(kind)) {
        if (next.size === 1) return prev
        next.delete(kind)
      } else {
        next.add(kind)
      }
      return next
    })
  }

  const visibleEvents = allEvents
    .filter(e => e.dayIdx === selectedDay && activeFilters.has(e.kind))

  const todayConfirmed = allEvents.filter(e => e.dayIdx === selectedDay && e.kind === 'confirmed')

  return (
    <div className="p-6 h-full overflow-y-auto bos-scroll" style={{ animation: 'bosUp 0.35s ease both' }}>

      {/* Title + toggle row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif font-medium text-[28px] leading-tight text-ink m-0">Calendar</h1>
          <div className="text-[12px] text-muted font-semibold mt-1">Week of Jul 13 – 18, 2026</div>
        </div>
        <div className="flex bg-surface-2 p-[3px] rounded-[13px] border border-line gap-[3px]">
          {(['day', 'week', 'month'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-[18px] py-[8px] rounded-[10px] text-[13px] border-none cursor-pointer capitalize transition-all',
                view === v ? 'font-bold bg-white text-ink shadow-sm' : 'font-semibold bg-transparent text-muted'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* Left: day strip + filters + events */}
        <div>

          {/* Day pills */}
          <div className="flex gap-[5px] mb-4">
            {CAL_WEEK.map((c, i) => {
              const isSelected = i === selectedDay
              const dayCount = allEvents.filter(e => e.dayIdx === i && e.kind === 'confirmed').length
              return (
                <button
                  key={c.d}
                  onClick={() => setSelectedDay(i)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-[10px] rounded-[14px] border-none cursor-pointer transition-colors relative',
                    isSelected ? 'bg-plum' : c.today ? 'bg-white border border-plum/30' : 'bg-white border border-line hover:bg-surface-2'
                  )}
                >
                  <span className={cn('text-[10.5px] font-semibold', isSelected ? 'text-white/70' : c.today ? 'text-plum' : 'text-muted')}>
                    {c.d}
                  </span>
                  <span className={cn('text-[17px] font-bold font-serif', isSelected ? 'text-white' : 'text-ink')}>
                    {c.n}
                  </span>
                  {dayCount > 0 && (
                    <span className={cn(
                      'text-[9px] font-bold px-[6px] py-[1px] rounded-full',
                      isSelected ? 'bg-white/20 text-white' : 'bg-plum-soft text-plum'
                    )}>
                      {dayCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Filter legend — clickable toggles */}
          <div className="flex gap-3 mb-5">
            {LEGEND.map(l => {
              const s = KIND[l.kind]
              const active = activeFilters.has(l.kind)
              return (
                <button
                  key={l.label}
                  onClick={() => toggleFilter(l.kind)}
                  className={cn(
                    'flex items-center gap-[6px] text-[12px] font-semibold px-[12px] py-[6px] rounded-[20px] border border-transparent cursor-pointer transition-all',
                    active
                      ? cn(s.bg, 'border-transparent opacity-100')
                      : 'bg-transparent border-line text-muted opacity-60'
                  )}
                >
                  <span className={cn('w-[8px] h-[8px] rounded-full flex-none', active ? s.dot : 'bg-muted/40')} />
                  <span className={active ? s.nameColor : 'text-muted'}>{l.label}</span>
                </button>
              )
            })}
            {activeFilters.size < 3 && (
              <button
                onClick={() => setActiveFilters(new Set(['confirmed', 'available', 'blocked']))}
                className="text-[11.5px] text-muted font-semibold ml-auto bg-transparent border-none cursor-pointer hover:text-ink transition-colors"
              >
                Show all
              </button>
            )}
          </div>

          {/* Event list */}
          {visibleEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="text-[32px]">📅</div>
              <div className="text-[14px] font-semibold text-ink">No events match</div>
              <div className="text-[12px] text-muted">Try adjusting the filters above</div>
            </div>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {visibleEvents.map((e, i) => {
                const s = KIND[e.kind]
                return (
                  <div key={i} className="flex gap-[11px] items-stretch">
                    <div className="w-[48px] flex-none text-right text-[11.5px] font-bold text-muted pt-[12px] shrink-0">
                      {e.time}
                    </div>
                    <div className={cn('flex-1 border-l-[3px] rounded-[12px] py-[11px] px-[13px] cursor-pointer hover:brightness-95 transition-all', s.bg, s.bar)}>
                      <div className="flex items-center gap-2">
                        {e.isLive && e.colorHex && (
                          <span className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center text-white font-bold text-[8px] font-serif flex-none" style={{ background: e.colorHex }}>
                            {e.initials}
                          </span>
                        )}
                        <div className={cn('font-bold text-[13.5px]', s.nameColor)}>{e.name}</div>
                        {e.isLive && <span className="text-[9px] font-bold bg-plum text-white px-[6px] py-[2px] rounded-full">NEW</span>}
                      </div>
                      <div className={cn('text-[11.5px] mt-[2px] font-medium', s.text)}>{e.style}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: summary panel */}
        <div className="flex flex-col gap-4">

          <div className="bg-white border border-line rounded-[18px] p-5">
            <h3 className="font-serif font-semibold text-[16px] text-ink m-0 mb-4">This week</h3>
            <div className="flex flex-col gap-3">
              {WEEK_STATS.map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[13px] text-muted font-medium">{s.label}</span>
                  <span className="font-bold text-[14px] text-ink">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-plum rounded-[18px] p-5">
            <div className="text-[11px] text-white/70 font-semibold mb-1">Week earnings</div>
            <div className="font-serif font-bold text-[28px] text-white">GH₵2,840</div>
            <div className="text-[11px] text-white/70 mt-1">▲ 18% vs last week</div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 text-muted text-[13px] font-semibold border border-dashed border-line rounded-[14px] py-[14px] bg-transparent cursor-pointer hover:bg-surface-2 hover:text-ink transition-colors">
            + Add time block
          </button>

          {todayConfirmed.length > 0 && (
            <div className="bg-white border border-line rounded-[18px] p-5">
              <h3 className="font-bold text-[14px] text-ink m-0 mb-3">
                {CAL_WEEK[selectedDay]?.d} {CAL_WEEK[selectedDay]?.n} · Confirmed
              </h3>
              <div className="flex flex-col gap-[10px]">
                {todayConfirmed.map((e, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11.5px] font-bold text-muted w-[36px] shrink-0">{e.time}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[12.5px] text-ink truncate">{e.name}</div>
                      <div className="text-[11px] text-muted">{e.style}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
