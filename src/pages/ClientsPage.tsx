import { useState } from 'react'
import { initials } from '@/lib/braider'
import { cn } from '@/lib/utils'
import type { Tab } from '@/components/layout/BottomNav'
import { useClients, useUpdateClient, type ClientRecord } from '@/lib/api/hooks/useClients'

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
  const [search,      setSearch]      = useState('')
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [toast,       setToast]       = useState<string | null>(null)

  const { data, isLoading, isError } = useClients(search || undefined)
  const clients = data?.items ?? []
  const selected = clients.find(c => c.id === selectedId) ?? null

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  return (
    <div className="flex h-full overflow-hidden relative" style={{ animation: 'bosUp 0.35s ease both' }}>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-[13px] font-semibold px-5 py-3 rounded-[14px] shadow-lg" style={{ animation: 'bosUp 0.25s ease both' }}>
          {toast}
        </div>
      )}

      {/* ── Left: client list ── */}
      <div className={cn(
        'flex flex-col border-r border-line bg-surface overflow-y-auto bos-scroll flex-none',
        selectedId !== null ? 'hidden lg:flex lg:w-[340px]' : 'w-full lg:w-[340px]'
      )}>
        <div className="p-5 pb-3">
          <h1 className="font-serif font-medium text-[24px] text-ink m-0 mb-[3px]">Customers</h1>
          <div className="text-[12px] text-muted font-semibold mb-4">
            {isLoading ? 'Loading…' : `${clients.length} client${clients.length !== 1 ? 's' : ''}`}
          </div>

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

        <div className="flex flex-col gap-[9px] px-5 pb-5">
          {isError && (
            <div className="text-center py-8 text-draft text-[13px]">Failed to load clients.<br/>Is the server running?</div>
          )}
          {isLoading && (
            <div className="flex flex-col gap-[9px]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[72px] bg-white border border-line rounded-[16px] animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && clients.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                'flex items-center gap-3 bg-white border rounded-[16px] px-[14px] py-[13px] cursor-pointer text-left w-full shadow-[0_2px_10px_rgba(110,27,58,0.04)] transition-all',
                selectedId === c.id ? 'border-plum bg-plum-soft' : 'border-line hover:border-plum/30'
              )}
            >
              <span
                className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center text-white font-bold text-[15px] font-serif flex-none"
                style={{ background: c.color_hex }}
              >
                {initials(c.name)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px] text-ink">{c.name}</div>
                <div className="text-[11.5px] text-muted mt-[2px]">{c.phone ?? 'No phone'}</div>
              </div>
            </button>
          ))}
          {!isLoading && !isError && clients.length === 0 && (
            <div className="text-center py-10 text-muted text-[13px]">
              {search ? 'No clients match your search' : 'No clients yet'}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      <div className={cn(
        'flex-1 overflow-y-auto bos-scroll',
        selectedId === null ? 'hidden lg:flex lg:flex-col lg:items-center lg:justify-center' : 'flex flex-col'
      )}>
        {selected === null ? (
          <div className="text-center p-8">
            <div className="text-[40px] mb-3">👤</div>
            <div className="font-serif text-[18px] font-medium text-ink mb-1">Select a customer</div>
            <div className="text-[12.5px] text-muted">Click a name on the left to see their profile</div>
          </div>
        ) : (
          <ClientDetail
            client={selected}
            onBack={() => setSelectedId(null)}
            onNavigate={onNavigate}
            onToast={showToast}
          />
        )}
      </div>
    </div>
  )
}

function ClientDetail({
  client: c,
  onBack,
  onNavigate,
  onToast,
}: {
  client: ClientRecord
  onBack: () => void
  onNavigate: (tab: Tab) => void
  onToast: (msg: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [phone,   setPhone]   = useState(c.phone ?? '')
  const [notes,   setNotes]   = useState(c.notes ?? '')
  const [saving,  setSaving]  = useState(false)

  const update = useUpdateClient()
  const waPhone = (c.phone ?? '').replace(/\s+/g, '').replace(/^\+/, '')

  const handleSave = async () => {
    setSaving(true)
    try {
      await update.mutateAsync({ id: c.id, phone: phone.trim() || undefined, notes: notes.trim() || undefined })
      onToast('Client updated')
      setEditing(false)
    } catch { onToast('Failed to save — try again') }
    finally { setSaving(false) }
  }

  const inputCls = 'w-full border border-line rounded-[12px] px-[13px] py-[10px] text-[13.5px] text-ink font-medium bg-white outline-none focus:border-plum/50 transition-colors'

  return (
    <div className="p-[22px_24px] w-full">

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
          style={{ background: c.color_hex }}
        >
          {initials(c.name)}
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif font-medium text-[23px] m-0 text-ink">{c.name}</h1>
          <div className="text-[12.5px] text-muted mt-[3px]">{c.phone ?? 'No phone number'}</div>
          <div className="text-[11px] text-muted mt-[5px]">
            Added {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <button
          onClick={() => { setPhone(c.phone ?? ''); setNotes(c.notes ?? ''); setEditing(e => !e) }}
          className="flex-none h-[34px] px-[14px] bg-surface-2 border border-line rounded-[10px] text-[12.5px] font-semibold text-ink cursor-pointer hover:bg-white transition-colors"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white border border-line rounded-[18px] p-5 mb-5 flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-semibold text-muted block mb-[7px]">Phone number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 0552030859"
              className={inputCls}
            />
            <div className="text-[11px] text-muted mt-[5px]">Used for WhatsApp reminders</div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted block mb-[7px]">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Allergies, preferences, style notes…"
              rows={3}
              className={cn(inputCls, 'resize-none')}
            />
          </div>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="w-full bg-plum text-white border-none h-[44px] rounded-[12px] font-bold text-[13.5px] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: notes + actions */}
        <div>
          <div className="bg-surface-2 rounded-[16px] p-[14px] mb-[18px]">
            <div className="text-[12px] font-bold text-plum mb-[6px]">📝 Notes</div>
            {c.notes
              ? <div className="text-[13px] leading-[1.5] text-ink">{c.notes}</div>
              : <div className="text-[13px] text-muted italic">No notes added yet</div>
            }
          </div>

          <div className="flex gap-[9px]">
            <button
              className="flex-1 bg-plum text-white border-none h-[46px] rounded-[14px] text-[13.5px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onNavigate('chat')}
            >
              Book appointment
            </button>
            {c.phone && (
              <a
                href={`https://wa.me/${waPhone}`}
                target="_blank"
                rel="noreferrer"
                className="flex-none bg-plum-soft text-plum no-underline h-[46px] px-[20px] rounded-[14px] text-[13.5px] font-semibold cursor-pointer hover:opacity-80 transition-opacity flex items-center"
              >
                Message
              </a>
            )}
          </div>
        </div>

        {/* Right: appointment history placeholder */}
        <div>
          <h2 className="text-[14px] font-bold m-0 mb-[11px] text-ink">Appointment history</h2>
          <div className="bg-surface-2 border border-line rounded-[16px] p-[22px] text-center">
            <div className="text-[28px] mb-2">📅</div>
            <div className="text-[13px] font-semibold text-ink mb-1">Coming soon</div>
            <div className="text-[12px] text-muted">Full appointment history will appear here.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
