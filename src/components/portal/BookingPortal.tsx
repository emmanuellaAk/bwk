import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { colorHex } from '@/lib/braider'
import { cn } from '@/lib/utils'
import { api, ApiError } from '@/lib/api/base'
import { salonStore } from '@/lib/api/salon'

interface Service { name: string; desc: string; price: number; deposit: number }
interface DateOpt  { dow: string; day: string; label: string; isoDate: string; dayIdx: number }
interface ColorOpt { name: string; hex: string }

const SERVICES: Service[] = [
  { name: 'Knotless Braids (Small)',   desc: 'Fine partings · 5–7 hrs',    price: 350, deposit: 105 },
  { name: 'Knotless Braids (Medium)',  desc: 'Classic look · 4–5 hrs',     price: 280, deposit: 84  },
  { name: 'Boho Braids',               desc: 'Curly ends · 6–8 hrs',       price: 420, deposit: 126 },
  { name: 'Goddess Braids',            desc: 'Bold & beautiful · 7–9 hrs', price: 450, deposit: 135 },
  { name: 'Cornrows',                  desc: 'Feed-in, straight · 2–3 hrs',price: 180, deposit: 54  },
  { name: 'Fulani Braids',             desc: 'With accessories · 5–6 hrs', price: 380, deposit: 114 },
]

function getPortalDates(): DateOpt[] {
  const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'] as const
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const
  const dates: DateOpt[] = []
  const d = new Date()
  d.setDate(d.getDate() + 1) // start from tomorrow
  d.setHours(0, 0, 0, 0)
  let idx = 0
  while (dates.length < 6) {
    const dow = d.getDay()
    if (dow !== 0) { // skip Sunday
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      dates.push({
        dow: DAYS[dow],
        day: String(d.getDate()),
        label: `${DAYS[dow][0]}${DAYS[dow].slice(1).toLowerCase()}, ${MONTHS[d.getMonth()]} ${d.getDate()}`,
        isoDate: iso,
        dayIdx: idx++,
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return dates
}

const DATES = getPortalDates()

const TIMES = ['9:00 AM', '11:00 AM', '2:00 PM', '4:30 PM']

const COLORS: ColorOpt[] = [
  { name: 'Natural Black', hex: colorHex('Natural Black') },
  { name: 'Dark Brown',    hex: colorHex('Dark Brown')    },
  { name: 'Burgundy',      hex: colorHex('Burgundy')      },
  { name: 'Honey Blonde',  hex: colorHex('Honey Blonde')  },
  { name: 'Ombre Grey',    hex: colorHex('Ombre Grey')    },
  { name: 'Copper',        hex: colorHex('Copper')        },
]

const STEP_META = [
  { title: 'Who are you?',             sub: "We'll keep your details safe"          },
  { title: 'What style would you like?',sub: 'Choose your look for the session'     },
  { title: 'When works for you?',       sub: 'Pick your preferred day'              },
  { title: 'Pick a time',               sub: 'Available slots this week'            },
  { title: 'Choose your colour',        sub: "We'll get it ready for you"           },
  { title: 'Share your inspo',          sub: 'Show Kez the look you love (optional)'},
  { title: 'Confirm & pay',             sub: 'Secure your spot with a deposit'      },
]

const TOTAL_STEPS = STEP_META.length

function cedi(n: number) { return `GH₵${n.toLocaleString()}` }

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C04A6A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16V4m0 0 4 4m-4-4-4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
  </svg>
)
const CardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

interface Props {
  onClose: () => void
}

export function BookingPortal({ onClose }: Props) {
  const qc = useQueryClient()
  const [step,       setStep]       = useState(0)
  const [name,       setName]       = useState('')
  const [phone,      setPhone]      = useState('')
  const [service,    setService]    = useState<Service | null>(null)
  const [date,       setDate]       = useState<DateOpt | null>(null)
  const [time,       setTime]       = useState<string | null>(null)
  const [color,      setColor]      = useState<ColorOpt | null>(null)
  const [photo,      setPhoto]      = useState(false)
  const [done,       setDone]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [payError,   setPayError]   = useState('')

  const canNext = (): boolean => {
    if (step === 0) return name.trim().length > 1 && phone.trim().length > 6
    if (step === 1) return service !== null
    if (step === 2) return date !== null
    if (step === 3) return time !== null
    if (step === 4) return color !== null
    if (step === 5) return true
    return false
  }

  const next = () => { if (step < TOTAL_STEPS - 1) setStep(s => s + 1) }
  const back = () => {
    if (step > 0) setStep(s => s - 1)
    else onClose()
  }

  const pay = async () => {
    if (!service || !date || !time || !color) return
    const salonId = salonStore.get()
    if (!salonId) {
      setPayError('Session expired — please refresh and try again.')
      return
    }
    setSubmitting(true)
    setPayError('')
    try {
      await api.post('/v1/public/bookings', {
        salon_id:     salonId,
        client_name:  name.trim(),
        client_phone: phone.trim(),
        service_name: service.name,
        date:         date.isoDate,
        time,
        color_hex:    color.hex,
        total_price:  service.price,
        deposit:      service.deposit,
      })
      void qc.invalidateQueries({ queryKey: ['appointments'] })
      setDone(true)
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setStep(0); setName(''); setPhone(''); setService(null)
    setDate(null); setTime(null); setColor(null); setPhoto(false)
    setDone(false); setPayError('')
  }

  const meta = STEP_META[step]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-[420px] mx-4 rounded-[28px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.22)] flex flex-col"
        style={{ maxHeight: 'min(90vh, 760px)', animation: 'bosPop 0.35s ease both' }}
      >
        {/* Pink gradient header */}
        <div
          className="flex-none text-center relative px-6 pt-8 pb-6"
          style={{ background: 'linear-gradient(165deg,#F8ECE8 0%,#F3DCE1 100%)' }}
        >
          <button
            onClick={onClose}
            className="absolute left-4 top-4 w-[34px] h-[34px] rounded-full bg-white/70 border-none cursor-pointer flex items-center justify-center text-plum hover:bg-white transition-colors"
          >
            <ChevronLeft />
          </button>
          <div className="w-[80px] h-[80px] rounded-full bg-plum flex items-center justify-center mx-auto mb-3 shadow-[0_8px_26px_rgba(110,27,58,0.22)]">
            <span className="font-serif font-semibold text-[30px] text-white">K</span>
          </div>
          <h1 className="font-serif font-medium text-[22px] m-0 text-[#3A1422]">
            Welcome to Braid with Kez <span style={{ color: '#C04A6A' }}>❤</span>
          </h1>
          <p className="text-[12.5px] text-[#8a6e76] mt-[6px] m-0">Book your appointment in under a minute</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto bos-scroll bg-white" style={{ minHeight: 0 }}>
          {done ? (
            /* Confirmation */
            <div className="text-center px-6 py-8" style={{ animation: 'bosUp .5s ease both' }}>
              <div
                className="w-[78px] h-[78px] rounded-full bg-success-bg text-success flex items-center justify-center mx-auto mb-5"
                style={{ animation: 'bosPop .5s ease both' }}
              >
                <CheckIcon />
              </div>
              <h2 className="font-serif font-medium text-[23px] m-0 text-ink">You're booked! 🎉</h2>
              <p className="text-[13.5px] text-muted mt-[10px] mb-0 max-w-[260px] mx-auto leading-relaxed">
                Kez will confirm shortly on WhatsApp. We can't wait to see you, {name.split(' ')[0]}!
              </p>
              <div className="bg-surface-2 rounded-[16px] p-[16px] mt-6 text-left">
                {[
                  { label: 'Name',    value: name                     },
                  { label: 'Service', value: service?.name ?? ''      },
                  { label: 'When',    value: `${date?.label}, ${time}` },
                  { label: 'Colour',  value: color?.name ?? ''        },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-[13px] py-[5px]">
                    <span className="text-muted">{r.label}</span>
                    <span className="font-bold text-ink">{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[13px] py-[9px] mt-[5px] border-t border-line items-center">
                  <span className="text-muted">Deposit paid</span>
                  <span className="font-bold text-success">{cedi(service?.deposit ?? 0)}</span>
                </div>
              </div>
              <button onClick={reset} className="mt-5 bg-transparent border-none text-plum font-semibold text-[13px] cursor-pointer">
                Book another →
              </button>
            </div>
          ) : (
            <div className="px-6 pt-5 pb-6">
              {/* Progress bar */}
              <div className="flex gap-[5px] mb-5">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-[5px] rounded-[3px] transition-all"
                    style={{ background: i <= step ? '#6E1B3A' : '#F6E7EC' }}
                  />
                ))}
              </div>

              <h2 className="font-serif font-medium text-[21px] m-0 mb-[4px] text-ink">{meta.title}</h2>
              <p className="text-[12.5px] text-muted m-0 mb-5">{meta.sub}</p>

              {/* Step 0: Name + phone */}
              {step === 0 && (
                <div className="flex flex-col gap-[12px]">
                  <div>
                    <label className="text-[11.5px] font-semibold text-muted block mb-[6px]">Full name</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Ama Mensah"
                      className="w-full border border-line rounded-[14px] px-[14px] py-[13px] text-[14px] text-ink placeholder:text-muted outline-none focus:border-plum transition-colors bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-semibold text-muted block mb-[6px]">Phone / WhatsApp</label>
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+233 24 000 0000"
                      type="tel"
                      className="w-full border border-line rounded-[14px] px-[14px] py-[13px] text-[14px] text-ink placeholder:text-muted outline-none focus:border-plum transition-colors bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-muted m-0">Kez will send your confirmation to this number.</p>
                </div>
              )}

              {/* Step 1: Service */}
              {step === 1 && (
                <div className="flex flex-col gap-[10px]">
                  {SERVICES.map(s => (
                    <button
                      key={s.name}
                      onClick={() => setService(s)}
                      className={cn(
                        'flex items-center justify-between w-full border rounded-[16px] px-[15px] py-[13px] cursor-pointer text-left transition-all',
                        service?.name === s.name ? 'border-plum bg-plum-soft' : 'border-line bg-white hover:border-plum/30'
                      )}
                    >
                      <div>
                        <div className="font-bold text-[14.5px] text-ink">{s.name}</div>
                        <div className="text-[11.5px] text-muted mt-[2px]">{s.desc}</div>
                      </div>
                      <div className="font-bold text-[14px] text-plum font-serif flex-none ml-3">{cedi(s.price)}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Date */}
              {step === 2 && (
                <div className="grid grid-cols-3 gap-[9px]">
                  {DATES.map(d => (
                    <button
                      key={d.isoDate}
                      onClick={() => setDate(d)}
                      className={cn(
                        'flex flex-col items-center py-[12px] rounded-[14px] border cursor-pointer transition-all',
                        date?.isoDate === d.isoDate ? 'border-plum bg-plum text-white' : 'border-line bg-white text-ink hover:border-plum/30'
                      )}
                    >
                      <span className="text-[10px] font-semibold opacity-70">{d.dow}</span>
                      <span className="font-serif font-bold text-[20px] mt-[3px]">{d.day}</span>
                      <span className="text-[9.5px] font-medium opacity-60 mt-[2px]">{d.label.split(', ')[1]?.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3: Time */}
              {step === 3 && (
                <div className="grid grid-cols-2 gap-[10px]">
                  {TIMES.map(t => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className={cn(
                        'h-[52px] rounded-[14px] border font-bold text-[14px] cursor-pointer transition-all',
                        time === t ? 'border-plum bg-plum text-white' : 'border-line bg-white text-ink hover:border-plum/30'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 4: Color */}
              {step === 4 && (
                <div className="grid grid-cols-3 gap-[12px]">
                  {COLORS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c)}
                      className={cn(
                        'flex flex-col items-center py-[14px] px-[8px] rounded-[16px] border cursor-pointer transition-all',
                        color?.name === c.name ? 'border-plum bg-plum-soft' : 'border-line bg-white hover:border-plum/30'
                      )}
                    >
                      <span
                        className="w-[46px] h-[46px] rounded-full border-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                        style={{ background: c.hex, borderColor: color?.name === c.name ? '#6E1B3A' : 'rgba(0,0,0,0.08)' }}
                      />
                      <span className="text-[11px] font-semibold text-ink mt-[8px] text-center leading-tight">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 5: Photo */}
              {step === 5 && (
                <button
                  onClick={() => setPhoto(p => !p)}
                  className={cn(
                    'w-full flex flex-col items-center justify-center rounded-[18px] border-2 border-dashed py-[40px] cursor-pointer transition-all',
                    photo ? 'border-plum bg-plum-soft' : 'border-[#E7D4CF] bg-[#FDF6F4] hover:border-plum/40'
                  )}
                >
                  <UploadIcon />
                  <div className="font-bold text-[14px] mt-[10px] text-[#3A1422]">
                    {photo ? '✓ Inspo photo added' : 'Tap to upload a photo'}
                  </div>
                  <div className="text-[11.5px] text-[#8a6e76] mt-[3px]">Show Kez the look you love (optional)</div>
                </button>
              )}

              {/* Step 6: Payment */}
              {step === 6 && service && date && time && color && (
                <div>
                  <div className="bg-surface-2 rounded-[18px] p-[18px] mb-4">
                    <div className="flex justify-between text-[13.5px] py-[5px]">
                      <span className="text-muted">Name</span>
                      <span className="font-bold text-ink">{name}</span>
                    </div>
                    <div className="flex justify-between text-[13.5px] py-[5px]">
                      <span className="text-muted">{service.name}</span>
                      <span className="font-bold text-ink">{cedi(service.price)}</span>
                    </div>
                    <div className="flex justify-between text-[13.5px] py-[5px]">
                      <span className="text-muted">{date.label}, {time}</span>
                      <span className="font-semibold text-ink">{color.name}</span>
                    </div>
                    <div className="flex justify-between items-center pt-[10px] mt-[8px] border-t border-line">
                      <div>
                        <div className="font-bold text-[14px] text-ink">Deposit due now</div>
                        <div className="text-[11px] text-muted mt-[2px]">
                          Balance {cedi(service.price - service.deposit)} on the day
                        </div>
                      </div>
                      <div className="font-serif font-bold text-[22px] text-plum">{cedi(service.deposit)}</div>
                    </div>
                  </div>
                  {payError && (
                    <div className="text-[12px] text-draft bg-draft-bg rounded-[12px] px-[13px] py-[10px] mb-3 leading-snug">
                      {payError}
                    </div>
                  )}
                  <button
                    onClick={() => { void pay() }}
                    disabled={submitting}
                    className={cn(
                      'w-full flex items-center justify-center gap-[9px] text-white border-none h-[52px] rounded-[16px] font-bold text-[15px] cursor-pointer shadow-[0_6px_18px_rgba(110,27,58,0.3)] transition-opacity',
                      submitting ? 'bg-plum/60 cursor-not-allowed' : 'bg-plum hover:opacity-90'
                    )}
                  >
                    <CardIcon /> {submitting ? 'Processing…' : `Pay ${cedi(service.deposit)} deposit`}
                  </button>
                  <div className="text-center text-[11px] text-muted mt-[11px]">🔒 Secured by Mobile Money & card</div>
                </div>
              )}

              {/* Navigation */}
              <div className={cn('flex gap-[10px] mt-6', step === 0 ? 'justify-end' : '')}>
                {step > 0 && step < TOTAL_STEPS - 1 && (
                  <button
                    onClick={back}
                    className="flex-none bg-transparent border border-[#E7D4CF] text-[#3A1422] h-[48px] px-[20px] rounded-[14px] font-semibold text-[13.5px] cursor-pointer hover:bg-surface-2 transition-colors"
                  >
                    Back
                  </button>
                )}
                {step < TOTAL_STEPS - 1 && (
                  <button
                    onClick={next}
                    disabled={!canNext()}
                    className={cn(
                      'flex-1 h-[48px] rounded-[14px] font-bold text-[13.5px] border-none cursor-pointer transition-all',
                      canNext() ? 'bg-plum text-white hover:opacity-90' : 'bg-surface-2 text-muted cursor-not-allowed'
                    )}
                  >
                    {step === 5 ? 'Continue to payment' : 'Next'}
                  </button>
                )}
                {step === TOTAL_STEPS - 1 && (
                  <button
                    onClick={back}
                    className="w-full mt-3 bg-transparent border border-[#E7D4CF] text-[#3A1422] h-[46px] rounded-[14px] font-semibold text-[13px] cursor-pointer hover:bg-surface-2 transition-colors"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
