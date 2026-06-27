import { useState, useEffect } from 'react'
import type { Booking, BookingDraft } from '@/lib/api/types'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const COLOR_MAP: Record<string, string> = {
  'honey blonde': '#C8924A',
  'natural black': '#1A1A1A',
  'burgundy': '#6B1A2E',
  'dark brown': '#3B1F10',
  'auburn': '#8B3A1A',
  'jet black': '#0D0D0D',
  'chocolate': '#5C3317',
  'copper': '#B87333',
}
function colorHex(c: string) {
  return COLOR_MAP[c.toLowerCase().trim()] ?? '#6E1B3A'
}
function initials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}
function cedi(n: number) {
  return `GH₵${n.toLocaleString()}`
}

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c0-4 4-6 9-6s9 2 9 6"/><circle cx="12" cy="7" r="4"/></svg>
)
const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
)
const CircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>
)
const NoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16M4 12h16M4 19h10"/></svg>
)
const CheckIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
)
const CalCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M3 9h18M8 2v4M16 2v4M9 14l2 2 4-4"/></svg>
)
const MsgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-12.1 7.5L3 21l2-5.9A8.4 8.4 0 1 1 21 11.5z"/></svg>
)

interface Props {
  booking: Booking
  onConfirm: (bookingId: string, draft: BookingDraft) => Promise<unknown>
}

export function BookingCard({ booking, onConfirm }: Props) {
  const [draft, setDraft] = useState<BookingDraft>(booking.draft)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [justConfirmed, setJustConfirmed] = useState(false)

  const isConfirmed = booking.status === 'CONFIRMED'
  const isDraft = !isConfirmed

  useEffect(() => {
    if (booking.status === 'CONFIRMED') {
      setJustConfirmed(true)
      const t = setTimeout(() => setJustConfirmed(false), 1400)
      return () => clearTimeout(t)
    }
  }, [booking.status])

  useEffect(() => {
    setDraft(booking.draft)
  }, [booking.draft])

  const hex = colorHex(draft.color)
  const bal = draft.price - draft.deposit
  const dateTime = [draft.date, draft.time].filter(Boolean).join(', ') || '—'

  const handleConfirm = async () => {
    setConfirming(true)
    try { await onConfirm(booking.id, draft) } finally { setConfirming(false) }
  }

  const field = (key: keyof BookingDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft(prev => ({ ...prev, [key]: key === 'price' || key === 'deposit' ? Number(e.target.value) : e.target.value }))

  return (
    <div
      className="self-start w-full relative rounded-[22px] overflow-hidden"
      style={{
        background: '#fff',
        border: isConfirmed ? '1.5px solid #2F7D5B' : '1.5px solid #B5762A',
        boxShadow: isConfirmed
          ? '0 8px 26px rgba(47,125,91,0.16)'
          : '0 8px 24px rgba(181,118,42,0.14)',
        animation: justConfirmed ? 'bosRing 1.2s ease both' : undefined,
      }}
    >
      {justConfirmed && (
        <div className="absolute inset-0 rounded-[22px] pointer-events-none z-10"
          style={{ background: 'radial-gradient(circle at 50% 40%,rgba(47,125,91,.22),transparent 70%)', animation: 'bosFlash 1.4s ease both' }}
        />
      )}

      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-[14px_16px_12px] border-b border-line" style={{ padding: '14px 16px 12px' }}>
        <div className="flex items-center gap-[9px]">
          <span className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center text-white font-bold text-[13px] font-serif flex-none" style={{ background: hex }}>
            {initials(draft.name)}
          </span>
          <div>
            <div className="font-bold text-[14.5px] leading-tight text-ink">{draft.name}</div>
            <div className="text-[11px] text-muted mt-[2px]">New booking</div>
          </div>
        </div>
        <span className={cn(
          'inline-flex items-center gap-[5px] text-[9.5px] font-bold px-[9px] py-[5px] rounded-[20px] tracking-[0.3px] whitespace-nowrap',
          isConfirmed ? 'bg-success-bg text-success text-[10px]' : 'bg-draft-bg text-draft'
        )}>
          {isConfirmed ? 'CONFIRMED' : 'DRAFT — needs confirmation'}
        </span>
      </div>

      {/* View mode */}
      {!editing && (
        <div className="px-4 py-[13px] flex flex-col gap-[11px]">
          {[
            { Icon: UserIcon, label: 'Service', value: draft.style },
            { Icon: CalIcon, label: 'Date & time', value: dateTime },
            {
              Icon: CircleIcon, label: 'Colour', value: (
                <span className="inline-flex items-center gap-[7px] text-[13.5px] font-semibold text-ink">
                  <span className="w-[13px] h-[13px] rounded-full border border-black/10 flex-none" style={{ background: hex }} />
                  {draft.color}
                </span>
              )
            },
            ...(draft.notes ? [{ Icon: NoteIcon, label: 'Notes', value: draft.notes }] : []),
          ].map(({ Icon, label, value }, i) => (
            <div key={i} className="flex items-center gap-[10px]">
              <span className="w-[18px] text-muted flex-none"><Icon /></span>
              <span className="text-[11px] text-muted w-[74px] flex-none">{label}</span>
              {typeof value === 'string'
                ? <span className="text-[13.5px] font-semibold text-ink">{value}</span>
                : value}
            </div>
          ))}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="px-4 py-[13px] flex flex-col gap-[9px]">
          <Input value={draft.name} onChange={field('name')} placeholder="Customer" />
          <Input value={draft.style} onChange={field('style')} placeholder="Service" />
          <div className="flex gap-2">
            <Input value={draft.date} onChange={field('date')} placeholder="Date" />
            <Input value={draft.time} onChange={field('time')} placeholder="Time" />
          </div>
          <Input value={draft.color} onChange={field('color')} placeholder="Colour" />
          <div className="flex gap-2">
            <Input value={String(draft.price)} onChange={field('price')} placeholder="Price" inputMode="numeric" />
            <Input value={String(draft.deposit)} onChange={field('deposit')} placeholder="Deposit" inputMode="numeric" />
          </div>
        </div>
      )}

      {/* Price strip */}
      <div className="mx-4 mb-[2px] px-[14px] py-[11px] bg-plum-soft rounded-[14px] flex items-center justify-between">
        {[
          { label: 'Price',   value: cedi(draft.price),   color: 'text-ink' },
          { label: 'Deposit', value: cedi(draft.deposit), color: 'text-success' },
          { label: 'Balance', value: cedi(bal),           color: 'text-plum' },
        ].map(({ label, value, color }, i) => (
          <div key={i} className="text-center flex-1">
            <div className="text-[10px] text-muted font-bold uppercase tracking-[0.4px]">{label}</div>
            <div className={cn('text-[14px] font-bold mt-[2px]', color)}>{value}</div>
          </div>
        )).flatMap((el, i, arr) =>
          i < arr.length - 1
            ? [el, <div key={`sep-${i}`} className="w-px h-[26px] bg-plum/20 mx-1" />]
            : [el]
        )}
      </div>

      {/* Draft buttons */}
      {isDraft && !editing && (
        <div className="px-4 py-[13px] pb-[15px] flex gap-[9px]">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 bg-plum text-white border-none h-[44px] rounded-[13px] text-[13.5px] font-bold cursor-pointer flex items-center justify-center gap-[7px] shadow-[0_5px_16px_rgba(110,27,58,0.26)] disabled:opacity-60"
          >
            <CheckIcon />
            {confirming ? 'Confirming…' : 'Confirm booking'}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex-none bg-transparent text-ink border border-line h-[44px] px-4 rounded-[13px] text-[13px] font-semibold cursor-pointer"
          >
            Edit
          </button>
        </div>
      )}

      {/* Edit buttons */}
      {editing && (
        <div className="px-4 py-[13px] pb-[15px] flex gap-[9px]">
          <button onClick={() => setEditing(false)} className="flex-1 bg-plum text-white border-none h-[44px] rounded-[13px] text-[13.5px] font-bold cursor-pointer">
            Save changes
          </button>
          <button onClick={() => { setDraft(booking.draft); setEditing(false) }} className="flex-none bg-transparent text-ink border border-line h-[44px] px-4 rounded-[13px] text-[13px] font-semibold cursor-pointer">
            Cancel
          </button>
        </div>
      )}

      {/* Confirmed state */}
      {isConfirmed && (
        <div className="px-4 pt-3 pb-[15px]">
          <div className="flex items-center gap-2 bg-success-bg text-success px-3 py-[9px] rounded-[12px] text-[12px] font-semibold mb-[11px]">
            <CalCheckIcon />
            Added to calendar · {draft.date}
          </div>
          <div className="flex gap-[9px]">
            <button className="flex-1 bg-plum-soft text-plum border-none h-[42px] rounded-[13px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-[7px]">
              <MsgIcon />
              Message {draft.name.split(' ')[0]}
            </button>
            <button className="flex-none bg-transparent text-ink border border-line h-[42px] px-[15px] rounded-[13px] text-[13px] font-semibold cursor-pointer">
              View
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
