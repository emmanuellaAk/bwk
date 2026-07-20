import { useEffect, useState } from 'react'
import { tokenStore } from '@/lib/api/token'
import { useSettings, useUpdateSettings } from '@/lib/api/hooks/useSettings'

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-muted block mb-[7px]">{label}</label>
      {children}
      {hint && <div className="text-[11px] text-muted mt-[5px]">{hint}</div>}
    </div>
  )
}

const inputCls = 'w-full border border-line rounded-[12px] px-[14px] py-[11px] text-[14px] text-ink font-medium bg-white outline-none focus:border-plum/50 transition-colors'

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-line rounded-[18px] p-5 flex flex-col gap-4">
      <h2 className="font-bold text-[14.5px] text-ink m-0">{title}</h2>
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const hasToken = !!tokenStore.get()
  const { data, isLoading } = useSettings()
  const update = useUpdateSettings()

  const [salonName,   setSalonName]   = useState('')
  const [ownerName,   setOwnerName]   = useState('')
  const [hoursOpen,   setHoursOpen]   = useState('09:00')
  const [hoursClose,  setHoursClose]  = useState('18:00')
  const [depositPct,  setDepositPct]  = useState('30')
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState<string | null>(null)

  // Populate form once data loads
  useEffect(() => {
    if (!data) return
    setSalonName(data.salon_name)
    setOwnerName(data.owner_name ?? '')
    setHoursOpen(data.hours_open ?? '09:00')
    setHoursClose(data.hours_close ?? '18:00')
    setDepositPct(String(data.default_deposit_pct))
  }, [data])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const handleSave = async () => {
    if (!salonName.trim()) { showToast('Salon name cannot be empty'); return }
    setSaving(true)
    try {
      await update.mutateAsync({
        salon_name: salonName.trim(),
        owner_name: ownerName.trim() || null,
        hours_open: hoursOpen,
        hours_close: hoursClose,
        default_deposit_pct: Math.min(100, Math.max(0, parseInt(depositPct, 10) || 30)),
      })
      showToast('Settings saved')
    } catch { showToast('Failed to save — try again') }
    finally { setSaving(false) }
  }

  if (!hasToken) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="font-bold text-[15px] text-ink mb-2">Sign in to manage settings</div>
          <div className="text-[13px] text-muted">Your salon settings are stored in your account.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-y-auto bos-scroll relative" style={{ animation: 'bosUp 0.35s ease both' }}>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-[13px] font-semibold px-5 py-3 rounded-[14px] shadow-lg" style={{ animation: 'bosUp 0.25s ease both' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif font-medium text-[28px] leading-tight text-ink m-0">Settings</h1>
        <div className="text-[12px] text-muted font-semibold mt-1">Salon & preferences</div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[140px] bg-surface-2 rounded-[18px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          <Section title="Your salon">
            <Field label="Salon name" hint="Shown on your public booking page">
              <input
                value={salonName}
                onChange={e => setSalonName(e.target.value)}
                placeholder="e.g. Braid with Kez"
                className={inputCls}
              />
            </Field>
            <Field label="Your name" hint="Used in greetings and by the AI assistant">
              <input
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="e.g. Kez"
                className={inputCls}
              />
            </Field>
          </Section>

          <Section title="Business hours">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Opens">
                <input
                  type="time"
                  value={hoursOpen}
                  onChange={e => setHoursOpen(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Closes">
                <input
                  type="time"
                  value={hoursClose}
                  onChange={e => setHoursClose(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="text-[12px] text-muted">
              Clients can only book appointments within these hours.
            </div>
          </Section>

          <Section title="Payments">
            <Field label="Default deposit %" hint="Applied when creating new services (can be overridden per service)">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={depositPct}
                  onChange={e => setDepositPct(e.target.value)}
                  className="w-[100px] border border-line rounded-[12px] px-[14px] py-[11px] text-[14px] text-ink font-medium bg-white outline-none focus:border-plum/50 transition-colors"
                />
                <span className="text-[13px] text-muted font-semibold">%</span>
                {salonName && (
                  <span className="text-[12.5px] text-muted">
                    = GH₵{Math.round(350 * (parseInt(depositPct, 10) || 0) / 100)} on a GH₵350 booking
                  </span>
                )}
              </div>
            </Field>
          </Section>

          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="w-full bg-plum text-white border-none h-[50px] rounded-[14px] font-bold text-[14.5px] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

        </div>
      )}
    </div>
  )
}
