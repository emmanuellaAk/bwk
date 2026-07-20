import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { initials, colorHex, cedi } from '@/lib/braider'
import {
  useAppointments,
  useUpdateAppointmentStatus,
  useCancelAppointment,
  useSendReminder,
} from '@/lib/api/hooks/useAppointments'
import type { AppointmentRecord, AppointmentStatus } from '@/lib/api/hooks/useAppointments'

type View = 'day' | 'week' | 'month'
type Kind = 'confirmed' | 'available' | 'blocked'

// ── Date helpers ──────────────────────────────────────────────────────────────

function getWeekStart(offset: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const toMon = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + toMon + offset * 7)
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function getTodayDayIdx(weekStart: Date): number {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  const diff = Math.round((t.getTime() - weekStart.getTime()) / 86400000)
  return diff >= 0 && diff <= 5 ? diff : -1
}

function fmtWeekRange(start: Date): string {
  const end = addDays(start, 5)
  const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${s} – ${end.getDate()}, ${start.getFullYear()}`
}

function fmtShortTime(isoStr: string): string {
  const d = new Date(isoStr)
  const h = d.getHours()
  const m = d.getMinutes()
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}:00` : `${h12}:${m.toString().padStart(2, '0')}`
}

function toCalEvent(a: AppointmentRecord, weekStart: Date) {
  const starts = new Date(a.starts_at)
  const dayIdx = Math.round((starts.getTime() - weekStart.getTime()) / 86400000)
  return {
    id:        a.id,
    status:    a.status,
    time:      fmtShortTime(a.starts_at),
    name:      a.client_name ?? 'Client',
    style:     a.service_name ?? a.notes ?? '',
    kind:      'confirmed' as Kind,
    dayIdx,
    colorHex:  a.color_hex,
    initials:  initials(a.client_name ?? '?'),
    isPending: a.status === 'pending',
  }
}

// ── Style maps ────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const [view, setView] = useState<View>('week')
  // On Sunday (0) the Mon–Sat week view is entirely in the past — show next week
  const [weekOffset, setWeekOffset] = useState(() => new Date().getDay() === 0 ? 1 : 0)
  const [selectedDay, setSelectedDay] = useState(() => {
    const initialOffset = new Date().getDay() === 0 ? 1 : 0
    const ws = getWeekStart(initialOffset)
    const idx = getTodayDayIdx(ws)
    return idx >= 0 ? idx : 0
  })
  const [activeFilters,  setActiveFilters]  = useState<Set<Kind>>(new Set(['confirmed', 'available', 'blocked']))
  const [actionLoading,  setActionLoading]  = useState<string | null>(null)
  const [confirmCancel,  setConfirmCancel]  = useState<string | null>(null)
  const [reminderSent,   setReminderSent]   = useState<string | null>(null)
  const [toast,          setToast]          = useState<string | null>(null)

  const updateStatus = useUpdateAppointmentStatus()
  const cancelAppt   = useCancelAppointment()
  const sendReminder = useSendReminder()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const handleAction = async (id: string, status: AppointmentStatus) => {
    setActionLoading(id)
    try {
      await updateStatus.mutateAsync({ id, status })
      showToast(status === 'confirmed' ? 'Appointment confirmed' : 'Appointment marked complete')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showToast(`Failed: ${msg}`)
    }
    finally { setActionLoading(null) }
  }

  const handleRemind = async (id: string) => {
    setActionLoading(id)
    try {
      await sendReminder.mutateAsync(id)
      setReminderSent(id)
      showToast('Reminder sent via WhatsApp')
    } catch { showToast('Could not send reminder — check Twilio settings') }
    finally { setActionLoading(null) }
  }

  const handleCancel = async (id: string) => {
    if (confirmCancel !== id) { setConfirmCancel(id); return }
    setActionLoading(id)
    setConfirmCancel(null)
    try {
      await cancelAppt.mutateAsync(id)
      showToast('Appointment cancelled')
    } catch { showToast('Cancel failed — try again') }
    finally { setActionLoading(null) }
  }

  useEffect(() => {
    const ws = getWeekStart(weekOffset)
    const idx = weekOffset === 0 ? getTodayDayIdx(ws) : 0
    setSelectedDay(idx >= 0 ? idx : 0)
  }, [weekOffset])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])
  const weekEnd   = useMemo(() => addDays(weekStart, 7),    [weekStart])

  const weekDays = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const date = addDays(weekStart, i)
      return {
        d: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
        n: date.getDate(),
        isToday: isSameDay(date, today),
      }
    }),
    [weekStart, today]
  )

  const { data: apptData } = useAppointments(weekStart, weekEnd)

  const apiEvents = useMemo(() => {
    if (!apptData) return []
    return apptData
      .filter(a => a.status !== 'cancelled')
      .map(a => toCalEvent(a, weekStart))
      .filter(e => e.dayIdx >= 0 && e.dayIdx <= 5)
  }, [apptData, weekStart])

  const allEvents = apiEvents

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

  const visibleEvents  = allEvents.filter(e => e.dayIdx === selectedDay && activeFilters.has(e.kind))
  const todayConfirmed = allEvents.filter(e => e.dayIdx === selectedDay && e.kind === 'confirmed')

  const confirmedCount = (apptData ?? []).filter(a => a.status !== 'cancelled').length
  const weekRevenue    = (apptData ?? [])
    .filter(a => a.status === 'confirmed' || a.status === 'completed')
    .reduce((s, a) => s + a.total_price, 0)

  return (
    <div className="p-6 h-full overflow-y-auto bos-scroll relative" style={{ animation: 'bosUp 0.35s ease both' }}>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-[13px] font-semibold px-5 py-3 rounded-[14px] shadow-lg" style={{ animation: 'bosUp 0.25s ease both' }}>
          {toast}
        </div>
      )}

      {/* Title + controls row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif font-medium text-[28px] leading-tight text-ink m-0">Calendar</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] bg-surface-2 border border-line text-muted text-[13px] font-bold cursor-pointer hover:bg-white hover:text-ink transition-colors"
              >
                ←
              </button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-[8px] h-[28px] flex items-center rounded-[8px] bg-surface-2 border border-line text-muted text-[11px] font-semibold cursor-pointer hover:bg-white hover:text-ink transition-colors"
                >
                  Today
                </button>
              )}
              <button
                onClick={() => setWeekOffset(o => o + 1)}
                className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] bg-surface-2 border border-line text-muted text-[13px] font-bold cursor-pointer hover:bg-white hover:text-ink transition-colors"
              >
                →
              </button>
            </div>
          </div>
          <div className="text-[12px] text-muted font-semibold mt-1">
            Week of {fmtWeekRange(weekStart)}
          </div>
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
            {weekDays.map((c, i) => {
              const isSelected = i === selectedDay
              const dayCount = allEvents.filter(e => e.dayIdx === i && e.kind === 'confirmed').length
              return (
                <button
                  key={c.d + i}
                  onClick={() => setSelectedDay(i)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-[10px] rounded-[14px] border-none cursor-pointer transition-colors relative',
                    isSelected ? 'bg-plum' : c.isToday ? 'bg-white border border-plum/30' : 'bg-white border border-line hover:bg-surface-2'
                  )}
                >
                  <span className={cn('text-[10.5px] font-semibold', isSelected ? 'text-white/70' : c.isToday ? 'text-plum' : 'text-muted')}>
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

          {/* Filter legend */}
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
              <div className="text-[14px] font-semibold text-ink">No appointments</div>
              <div className="text-[12px] text-muted">
                {apptData ? 'Nothing scheduled for this day' : 'Connect to the backend to load appointments'}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {visibleEvents.map((e, i) => {
                const s        = KIND[e.kind]
                const isActing = actionLoading === e.id
                const needsAction = e.status === 'pending' || e.status === 'confirmed'
                return (
                  <div key={i} className="flex gap-[11px] items-stretch">
                    <div className="w-[48px] flex-none text-right text-[11.5px] font-bold text-muted pt-[12px] shrink-0">
                      {e.time}
                    </div>
                    <div className={cn('flex-1 border-l-[3px] rounded-[12px] py-[11px] px-[13px] transition-all', s.bg, s.bar)}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center text-white font-bold text-[8px] font-serif flex-none"
                          style={{ background: e.colorHex }}
                        >
                          {e.initials}
                        </span>
                        <div className={cn('font-bold text-[13.5px] flex-1', s.nameColor)}>{e.name}</div>
                        {e.isPending    && <span className="text-[9px] font-bold bg-draft-bg text-draft px-[6px] py-[2px] rounded-full">PENDING</span>}
                        {e.status === 'completed' && <span className="text-[9px] font-bold bg-success-bg text-success px-[6px] py-[2px] rounded-full">DONE</span>}
                      </div>
                      {e.style && <div className={cn('text-[11.5px] mt-[2px] font-medium', s.text)}>{e.style}</div>}

                      {/* Action row */}
                      {needsAction && (
                        <div className="flex items-center gap-2 mt-[9px]">
                          {confirmCancel === e.id ? (
                            <>
                              <span className="text-[11.5px] text-draft font-semibold">Cancel appointment?</span>
                              <button
                                onClick={() => void handleCancel(e.id)}
                                disabled={isActing}
                                className="h-[26px] px-[10px] bg-draft text-white rounded-[8px] text-[11px] font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmCancel(null)}
                                className="h-[26px] px-[10px] bg-surface-2 text-ink border border-line rounded-[8px] text-[11px] font-bold cursor-pointer hover:bg-white"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <>
                              {e.status === 'pending' && (
                                <button
                                  onClick={() => void handleAction(e.id, 'confirmed')}
                                  disabled={isActing}
                                  className="h-[26px] px-[10px] bg-plum text-white rounded-[8px] text-[11px] font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                                >
                                  {isActing ? '…' : 'Confirm'}
                                </button>
                              )}
                              {e.status === 'confirmed' && (
                                <button
                                  onClick={() => void handleAction(e.id, 'completed')}
                                  disabled={isActing}
                                  className="h-[26px] px-[10px] bg-success text-white rounded-[8px] text-[11px] font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                                >
                                  {isActing ? '…' : 'Complete'}
                                </button>
                              )}
                              {e.status === 'confirmed' && (
                                <button
                                  onClick={() => void handleRemind(e.id)}
                                  disabled={isActing || reminderSent === e.id}
                                  className="h-[26px] px-[10px] bg-surface-2 text-ink border border-line rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-white disabled:opacity-50 transition-colors"
                                >
                                  {reminderSent === e.id ? '✓ Sent' : '📲 Remind'}
                                </button>
                              )}
                              <button
                                onClick={() => void handleCancel(e.id)}
                                disabled={isActing}
                                className="h-[26px] px-[8px] bg-transparent text-draft text-[11px] font-semibold border-none cursor-pointer hover:underline disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      )}
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
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted font-medium">Appointments</span>
                <span className="font-bold text-[14px] text-ink">
                  {apptData ? confirmedCount : '–'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted font-medium">Revenue</span>
                <span className="font-bold text-[14px] text-ink">
                  {apptData ? cedi(weekRevenue) : '–'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted font-medium">Open slots</span>
                <span className="font-bold text-[14px] text-ink">–</span>
              </div>
            </div>
          </div>

          <div className="bg-plum rounded-[18px] p-5">
            <div className="text-[11px] text-white/70 font-semibold mb-1">Week earnings</div>
            <div className="font-serif font-bold text-[28px] text-white">
              {apptData ? cedi(weekRevenue) : 'GH₵–'}
            </div>
            <div className="text-[11px] text-white/70 mt-1">
              {apptData ? `${confirmedCount} confirmed` : 'Connect API to track earnings'}
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 text-muted text-[13px] font-semibold border border-dashed border-line rounded-[14px] py-[14px] bg-transparent cursor-pointer hover:bg-surface-2 hover:text-ink transition-colors">
            + Add time block
          </button>

          {todayConfirmed.length > 0 && (
            <div className="bg-white border border-line rounded-[18px] p-5">
              <h3 className="font-bold text-[14px] text-ink m-0 mb-3">
                {weekDays[selectedDay]?.d} {weekDays[selectedDay]?.n} · Confirmed
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
