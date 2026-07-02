import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useLogin, useRegister } from '@/lib/api/hooks/useAuth'
import { ApiError } from '@/lib/api/base'

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
  const [mode,       setMode]      = useState<'login' | 'register'>('login')
  const [phone,      setPhone]     = useState('')
  const [pass,       setPass]      = useState('')
  const [salonName,  setSalonName] = useState('')
  const [showPw,     setShowPw]    = useState(false)
  const [error,      setError]     = useState('')

  const login    = useLogin(onLogin)
  const register = useRegister(onLogin)

  const loading = login.isPending || register.isPending

  const handleError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.code === 'INVALID_CREDENTIALS') setError('Incorrect phone number or password.')
      else if (err.code === 'PHONE_TAKEN')    setError('An account with this number already exists.')
      else                                     setError(err.message)
    } else {
      setError('Something went wrong. Is the server running?')
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'login') {
      login.mutate({ phone, password: pass }, { onError: handleError })
    } else {
      register.mutate({ phone, password: pass, salon_name: salonName }, { onError: handleError })
    }
  }

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); setError('')
  }

  const isLogin = mode === 'login'
  const canSubmit = phone && pass && (isLogin || salonName)

  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: 'radial-gradient(120% 120% at 80% 0%,#F3DDE2 0%,#EFE6E1 38%,#E9E0DC 100%)' }}>
      <div className="w-full max-w-[400px]" style={{ animation: 'bosUp 0.5s ease both' }}>

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-[72px] h-[72px] rounded-full bg-plum flex items-center justify-center shadow-[0_8px_28px_rgba(110,27,58,0.28)] mb-4">
            <span className="font-serif font-semibold text-[28px] text-white">K</span>
          </div>
          <h1 className="font-serif font-medium text-[28px] text-ink m-0">BraiderOS</h1>
          <p className="text-[13px] text-muted mt-[5px] m-0">
            {isLogin ? 'Sign in to your dashboard' : 'Create your account'}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-white/70 rounded-[16px] p-[4px] mb-4 border border-line">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                'flex-1 h-[38px] rounded-[12px] text-[13px] font-semibold border-none cursor-pointer transition-all',
                mode === m ? 'bg-plum text-white shadow-sm' : 'bg-transparent text-muted hover:text-ink'
              )}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        {/* Card */}
        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 shadow-[0_8px_40px_rgba(110,27,58,0.10)] border border-line flex flex-col gap-4">

          {!isLogin && (
            <div>
              <label className="text-[11.5px] font-semibold text-muted block mb-[7px]">Salon name</label>
              <input
                value={salonName}
                onChange={e => setSalonName(e.target.value)}
                placeholder="e.g. Kez Braids Studio"
                autoComplete="organization"
                className="w-full border border-line rounded-[14px] px-[14px] py-[13px] text-[14px] text-ink placeholder:text-muted outline-none focus:border-plum transition-colors bg-white"
              />
            </div>
          )}

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
                autoComplete={isLogin ? 'current-password' : 'new-password'}
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
            disabled={loading || !canSubmit}
            className={cn(
              'w-full h-[50px] rounded-[14px] font-bold text-[15px] border-none cursor-pointer transition-all mt-1',
              loading || !canSubmit
                ? 'bg-surface-2 text-muted cursor-not-allowed'
                : 'bg-plum text-white shadow-[0_4px_16px_rgba(110,27,58,0.28)] hover:opacity-90'
            )}
          >
            {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Sign in' : 'Create account')}
          </button>
        </form>

        {isLogin && (
          <div className="mt-4 text-center">
            <p className="text-[11.5px] text-muted">
              No account yet?{' '}
              <button onClick={() => switchMode('register')} className="text-plum font-semibold bg-transparent border-none cursor-pointer hover:opacity-80">
                Register here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
