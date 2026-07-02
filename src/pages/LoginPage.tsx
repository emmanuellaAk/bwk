import { useState } from 'react'
import { cn } from '@/lib/utils'

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

interface Props { onLogin: () => void }

export function LoginPage({ onLogin }: Props) {
  const [phone,   setPhone]   = useState('')
  const [pass,    setPass]    = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    if (phone.replace(/\s/g, '') === '0277332556' || phone.replace(/\s/g, '') === '02773325567') {
      setError(''); setLoading(false)
      onLogin()
      return
    }
    if (pass !== 'braider2026') {
      setError('Incorrect phone or password. Try the demo credentials below.')
      setLoading(false)
      return
    }
    setLoading(false)
    onLogin()
  }

  const demoFill = () => { setPhone('0277 332 5567'); setPass('braider2026'); setError('') }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: 'radial-gradient(120% 120% at 80% 0%,#F3DDE2 0%,#EFE6E1 38%,#E9E0DC 100%)' }}>
      <div className="w-full max-w-[400px]" style={{ animation: 'bosUp 0.5s ease both' }}>

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-[72px] h-[72px] rounded-full bg-plum flex items-center justify-center shadow-[0_8px_28px_rgba(110,27,58,0.28)] mb-4">
            <span className="font-serif font-semibold text-[28px] text-white">K</span>
          </div>
          <h1 className="font-serif font-medium text-[28px] text-ink m-0">BraiderOS</h1>
          <p className="text-[13px] text-muted mt-[5px] m-0">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 shadow-[0_8px_40px_rgba(110,27,58,0.10)] border border-line flex flex-col gap-4">

          <div>
            <label className="text-[11.5px] font-semibold text-muted block mb-[7px]">Phone number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0277 332 5567"
              type="tel"
              autoComplete="tel"
              className="w-full border border-line rounded-[14px] px-[14px] py-[13px] text-[14px] text-ink placeholder:text-muted outline-none focus:border-plum transition-colors bg-white"
            />
          </div>

          <div>
            <label className="text-[11.5px] font-semibold text-muted block mb-[7px]">Password</label>
            <div className="relative">
              <input
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••••"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full border border-line rounded-[14px] px-[14px] py-[13px] pr-[44px] text-[14px] text-ink placeholder:text-muted outline-none focus:border-plum transition-colors bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-[13px] top-1/2 -translate-y-1/2 text-muted bg-transparent border-none cursor-pointer p-0 hover:text-ink transition-colors"
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          {error && (
            <div className="text-[12px] text-draft bg-draft-bg rounded-[12px] px-[13px] py-[10px] leading-snug">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone || !pass}
            className={cn(
              'w-full h-[50px] rounded-[14px] font-bold text-[15px] border-none cursor-pointer transition-all mt-1',
              loading || !phone || !pass
                ? 'bg-surface-2 text-muted cursor-not-allowed'
                : 'bg-plum text-white shadow-[0_4px_16px_rgba(110,27,58,0.28)] hover:opacity-90'
            )}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo hint */}
        <div className="mt-4 text-center">
          <button
            onClick={demoFill}
            className="text-[12px] text-muted bg-transparent border-none cursor-pointer hover:text-plum transition-colors"
          >
            Use demo credentials →
          </button>
        </div>
      </div>
    </div>
  )
}
