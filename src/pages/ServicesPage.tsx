import { useState } from 'react'
import { cedi } from '@/lib/braider'
import { cn } from '@/lib/utils'
import { tokenStore } from '@/lib/api/token'
import {
  useServices, useCreateService, useUpdateService, useDeleteService,
  type ServiceRecord,
} from '@/lib/api/hooks/useServices'

// ── Demo fallback ─────────────────────────────────────────────────────────────

const DEMO_SERVICES: ServiceRecord[] = [
  { id: 'd1', salon_id: '', name: 'Knotless Braids', duration_minutes: 240, price: 380, deposit_pct: 30, created_at: '', updated_at: '' },
  { id: 'd2', salon_id: '', name: 'Boho Braids',     duration_minutes: 300, price: 420, deposit_pct: 30, created_at: '', updated_at: '' },
  { id: 'd3', salon_id: '', name: 'Box Braids',      duration_minutes: 210, price: 300, deposit_pct: 30, created_at: '', updated_at: '' },
  { id: 'd4', salon_id: '', name: 'Fulani Braids',   duration_minutes: 180, price: 340, deposit_pct: 30, created_at: '', updated_at: '' },
  { id: 'd5', salon_id: '', name: 'Cornrows',        duration_minutes:  90, price: 160, deposit_pct: 30, created_at: '', updated_at: '' },
  { id: 'd6', salon_id: '', name: 'Ghana Weaving',   duration_minutes: 120, price: 200, deposit_pct: 30, created_at: '', updated_at: '' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

interface FormState {
  name: string
  hours: string
  mins: string
  price: string
  deposit_pct: string
}

function emptyForm(): FormState {
  return { name: '', hours: '4', mins: '0', price: '', deposit_pct: '30' }
}

function formFromService(s: ServiceRecord): FormState {
  return {
    name: s.name,
    hours: String(Math.floor(s.duration_minutes / 60)),
    mins: String(s.duration_minutes % 60),
    price: String(s.price),
    deposit_pct: String(s.deposit_pct),
  }
}

function parseMinutes(h: string, m: string): number {
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0)
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

// ── Inline form ───────────────────────────────────────────────────────────────

function ServiceForm({
  initial, onSave, onCancel, saving,
}: {
  initial: FormState
  onSave: (f: FormState) => void
  onCancel: () => void
  saving: boolean
}) {
  const [f, setF] = useState(initial)
  const depositAmt = Math.round((Number(f.price) || 0) * (Number(f.deposit_pct) || 0) / 100)
  const canSave = f.name.trim().length > 0 && (Number(f.hours) > 0 || Number(f.mins) > 0) && Number(f.price) > 0

  const inputCls = 'w-full border border-line rounded-[12px] px-[12px] py-[10px] text-[13.5px] text-ink font-medium bg-white outline-none focus:border-plum/50 transition-colors'
  const labelCls = 'text-[11px] font-semibold text-muted block mb-[6px]'

  return (
    <div className="border-2 border-plum/20 bg-plum-soft rounded-[18px] p-5">
      <div className="flex flex-col gap-[14px]">
        <div>
          <label className={labelCls}>Service name</label>
          <input
            value={f.name}
            onChange={e => setF({ ...f, name: e.target.value })}
            placeholder="e.g. Knotless Braids"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Hours</label>
            <input type="number" min="0" max="12" value={f.hours}
              onChange={e => setF({ ...f, hours: e.target.value })}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mins</label>
            <input type="number" min="0" max="59" step="15" value={f.mins}
              onChange={e => setF({ ...f, mins: e.target.value })}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Price (GH₵)</label>
            <input type="number" min="0" value={f.price}
              onChange={e => setF({ ...f, price: e.target.value })}
              placeholder="380"
              className={inputCls} />
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="w-[110px]">
            <label className={labelCls}>Deposit %</label>
            <input type="number" min="0" max="100" value={f.deposit_pct}
              onChange={e => setF({ ...f, deposit_pct: e.target.value })}
              className={inputCls} />
          </div>
          {Number(f.price) > 0 && (
            <div className="text-[12.5px] text-muted font-semibold pb-[11px]">
              = {cedi(depositAmt)} upfront
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-[2px]">
          <button
            onClick={onCancel}
            className="flex-1 border border-line bg-white text-ink text-[13.5px] font-semibold rounded-[12px] h-[44px] cursor-pointer hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(f)}
            disabled={saving || !canSave}
            className="flex-[2] bg-plum text-white text-[13.5px] font-semibold rounded-[12px] h-[44px] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save service'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ServicesPage() {
  const [adding,     setAdding]     = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState<string | null>(null)

  const hasToken = !!tokenStore.get()
  const isDemo   = !hasToken

  const { data: apiData, isLoading } = useServices()
  const createSvc = useCreateService()
  const updateSvc = useUpdateService()
  const deleteSvc = useDeleteService()

  const services: ServiceRecord[] = isDemo ? DEMO_SERVICES : (apiData ?? [])

  const avgPrice = services.length > 0
    ? services.reduce((s, r) => s + r.price, 0) / services.length
    : 0

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const handleCreate = async (f: FormState) => {
    if (isDemo) { setAdding(false); showToast('Service added (demo)'); return }
    setSaving(true)
    try {
      await createSvc.mutateAsync({
        name: f.name.trim(),
        duration_minutes: parseMinutes(f.hours, f.mins),
        price: Number(f.price),
        deposit_pct: Number(f.deposit_pct),
      })
      setAdding(false)
      showToast('Service added')
    } catch { showToast('Failed to save — try again') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (id: string, f: FormState) => {
    if (isDemo) { setEditingId(null); showToast('Updated (demo)'); return }
    setSaving(true)
    try {
      await updateSvc.mutateAsync({
        id,
        name: f.name.trim(),
        duration_minutes: parseMinutes(f.hours, f.mins),
        price: Number(f.price),
        deposit_pct: Number(f.deposit_pct),
      })
      setEditingId(null)
      showToast('Service updated')
    } catch { showToast('Failed to update — try again') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (isDemo) { setConfirmDel(null); showToast('Removed (demo)'); return }
    try {
      await deleteSvc.mutateAsync(id)
      setConfirmDel(null)
      showToast('Service removed')
    } catch {
      showToast('Failed to delete — try again')
      setConfirmDel(null)
    }
  }

  return (
    <div className="p-6 h-full overflow-y-auto bos-scroll relative" style={{ animation: 'bosUp 0.35s ease both' }}>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-[13px] font-semibold px-5 py-3 rounded-[14px] shadow-lg" style={{ animation: 'bosUp 0.25s ease both' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif font-medium text-[28px] leading-tight text-ink m-0">Services</h1>
          <div className="text-[12px] text-muted font-semibold mt-1">
            {services.length} service{services.length !== 1 ? 's' : ''}{isDemo ? ' · Demo data' : ''}
          </div>
        </div>
        {!adding && !editingId && (
          <button
            onClick={() => { setAdding(true); setEditingId(null) }}
            className="flex items-center gap-[7px] bg-plum text-white border-none rounded-[13px] h-[40px] px-[16px] text-[13.5px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            <PlusIcon /> Add service
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <div className="bg-white border border-line rounded-[16px] p-[14px]">
          <div className="text-[10.5px] text-muted font-semibold">Services</div>
          <div className="font-serif font-bold text-[22px] text-ink mt-1">{services.length}</div>
          <div className="text-[11px] text-muted font-semibold mt-[5px]">on offer</div>
        </div>
        <div className="bg-plum text-white rounded-[16px] p-[14px]">
          <div className="text-[10.5px] opacity-75 font-semibold">Avg price</div>
          <div className="font-serif font-bold text-[22px] mt-1">{cedi(Math.round(avgPrice))}</div>
          <div className="text-[11px] opacity-70 font-semibold mt-[5px]">per booking</div>
        </div>
        <div className="bg-surface-2 border border-line rounded-[16px] p-[14px]">
          <div className="text-[10.5px] text-muted font-semibold">Deposit</div>
          <div className="font-serif font-bold text-[22px] text-ink mt-1">30%</div>
          <div className="text-[11px] text-muted font-semibold mt-[5px]">default</div>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-4">
          <ServiceForm
            initial={emptyForm()}
            onSave={f => void handleCreate(f)}
            onCancel={() => setAdding(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Loading skeletons */}
      {hasToken && isLoading && (
        <div className="flex flex-col gap-[9px]">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[72px] bg-surface-2 rounded-[16px] animate-pulse" />
          ))}
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div className="flex flex-col gap-[9px]">
          {services.map(svc => (
            <div key={svc.id}>
              {editingId === svc.id ? (
                <ServiceForm
                  initial={formFromService(svc)}
                  onSave={f => void handleUpdate(svc.id, f)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              ) : (
                <div className={cn(
                  'bg-white border border-line rounded-[16px] px-[16px] py-[14px] flex items-center gap-4 shadow-[0_1px_6px_rgba(110,27,58,0.04)]',
                  confirmDel === svc.id && 'border-draft/40 bg-[rgba(181,118,42,0.03)]',
                )}>
                  <span className="w-[42px] h-[42px] rounded-[13px] bg-plum flex items-center justify-center text-white font-serif font-bold text-[17px] flex-none">
                    {svc.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-ink leading-tight">{svc.name}</div>
                    <div className="flex items-center gap-[8px] mt-[6px] flex-wrap">
                      <span className="text-[12px] text-muted font-semibold">{fmtDuration(svc.duration_minutes)}</span>
                      <span className="w-[3px] h-[3px] rounded-full bg-muted/40 flex-none" />
                      <span className="text-[12px] text-ink font-bold">{cedi(svc.price)}</span>
                      <span className="w-[3px] h-[3px] rounded-full bg-muted/40 flex-none" />
                      <span className="text-[11px] font-semibold bg-plum-soft text-plum px-[8px] py-[3px] rounded-full">
                        {svc.deposit_pct}% deposit
                      </span>
                    </div>
                  </div>

                  {confirmDel === svc.id ? (
                    <div className="flex items-center gap-2 flex-none">
                      <span className="text-[11.5px] text-draft font-semibold">Delete?</span>
                      <button
                        onClick={() => void handleDelete(svc.id)}
                        className="bg-draft text-white border-none h-[30px] px-[11px] rounded-[8px] text-[11.5px] font-bold cursor-pointer hover:opacity-90"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDel(null)}
                        className="bg-surface-2 text-ink border border-line h-[30px] px-[11px] rounded-[8px] text-[11.5px] font-bold cursor-pointer hover:bg-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-none">
                      <button
                        onClick={() => { setEditingId(svc.id); setAdding(false); setConfirmDel(null) }}
                        className="w-[34px] h-[34px] rounded-[10px] bg-surface-2 border border-line flex items-center justify-center text-muted cursor-pointer hover:text-plum hover:border-plum/30 transition-colors"
                        aria-label="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => { setConfirmDel(svc.id); setEditingId(null) }}
                        className="w-[34px] h-[34px] rounded-[10px] bg-surface-2 border border-line flex items-center justify-center text-muted cursor-pointer hover:text-draft hover:border-draft/30 transition-colors"
                        aria-label="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {services.length === 0 && !adding && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-surface-2 rounded-[18px]">
              <div className="font-serif text-[32px] text-muted">✂</div>
              <div className="font-bold text-[14px] text-ink">No services yet</div>
              <div className="text-[13px] text-muted">Add your first service to get started</div>
              <button
                onClick={() => setAdding(true)}
                className="mt-1 bg-plum text-white border-none h-[40px] px-[20px] rounded-[12px] text-[13.5px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Add first service
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
