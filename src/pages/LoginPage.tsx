import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useLogin, useRegister, useSendOtp, useVerifyPhone, useResetPassword } from '@/lib/api/hooks/useAuth'
import { ApiError } from '@/lib/api/base'

type Screen =
  | 'login'
  | 'register'
  | 'verify-otp'       // after register — verify phone
  | 'forgot-phone'     // enter phone to reset
  | 'forgot-otp'       // enter OTP for reset
  | 'forgot-newpw'     // enter new password

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
)

interface Props { onLogin: () => void }

export function LoginPage({ onLogin }: Props) {
  const [screen,    setScreen]    = useState<Screen>('login')
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')
  const [pass,      setPass]      = useState('')
  const [newPass,   setNewPass]   = useState('')
  const [salonName, setSalon]     = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [otp,       setOtp]       = useState('')
  const [otpPhone,  setOtpPhone]  = useState('')
  // Where the OTP screen was entered from — controls what "wrong number?" offers:
  // a fresh signup can just go back and retype the number (nothing real exists yet),
  // an existing-but-unverified account can't — that number *is* the account.
  const [otpSource, setOtpSource] = useState<'register' | 'login'>('register')
  const [error,     setError]     = useState('')
  const [countdown, setCountdown] = useState(0)

  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const login = useLogin((verified, normPhone) => {
    if (!verified) {
      setOtpPhone(normPhone); setOtpSource('login'); setScreen('verify-otp')
      sendOtp.mutate({ phone: normPhone, purpose: 'verify' }, { onSuccess: startCountdown, onError: handleError })
    } else onLogin()
  })
  const register = useRegister((normPhone) => {
    setOtpPhone(normPhone); setOtpSource('register'); setScreen('verify-otp')
    sendOtp.mutate({ phone: normPhone, purpose: 'verify' }, { onSuccess: startCountdown, onError: handleError })
  })
  const sendOtp     = useSendOtp()
  const verifyPhone = useVerifyPhone(onLogin)
  const resetPw     = useResetPassword(() => { go('login') })

  const loading = login.isPending || register.isPending || sendOtp.isPending || verifyPhone.isPending || resetPw.isPending

  function startCountdown() {
    setCountdown(60)
    setTimeout(() => otpRef.current?.focus(), 50)
  }

  function handleError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.code === 'INVALID_OTP') {
        const remaining = err.details.attempts_remaining
        setError(
          typeof remaining === 'number'
            ? `Code is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : 'Code is incorrect or has expired.'
        )
        return
      }
      const map: Record<string, string> = {
        INVALID_CREDENTIALS: 'Incorrect phone number or password.',
        PHONE_TAKEN:         'An account with this number already exists.',
        EMAIL_TAKEN:         'An account with this email already exists.',
        NOT_FOUND:           'No account found with that phone number.',
        OTP_NOT_CONFIGURED:  'OTP service not set up — contact support.',
        OTP_SEND_FAILED:     'Could not send code. Check your number and try again.',
      }
      setError(map[err.code] ?? err.message)
    } else {
      setError('Something went wrong. Is the server running?')
    }
  }

  function go(s: Screen) { setScreen(s); setError(''); setOtp('') }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (screen === 'login') {
    const submit = (e: React.FormEvent) => {
      e.preventDefault(); setError('')
      login.mutate({ phone, password: pass }, { onError: handleError })
    }
    return (
      <Shell>
        <Brand subtitle="Sign in to your dashboard" />
        <ModeTabs mode="login" onChange={m => go(m === 'login' ? 'login' : 'register')} />
        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 shadow-[0_8px_40px_rgba(110,27,58,0.10)] border border-line flex flex-col gap-4">
          <Field label="Phone number">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0277 123 4567" type="tel" autoComplete="tel" className={inputCls} />
          </Field>
          <Field label="Password">
            <PasswordInput value={pass} onChange={setPass} show={showPw} onToggle={() => setShowPw(p => !p)} autoComplete="current-password" />
          </Field>
          <ErrorBox msg={error} />
          <SubmitBtn disabled={loading || !phone || !pass} loading={loading} label="Sign in" loadingLabel="Signing in…" />
        </form>
        <div className="mt-4 text-center flex flex-col gap-2">
          <p className="text-[11.5px] text-muted m-0">
            No account yet?{' '}
            <InlineBtn onClick={() => go('register')}>Register here</InlineBtn>
          </p>
          <p className="text-[11.5px] text-muted m-0">
            <InlineBtn onClick={() => go('forgot-phone')}>Forgot password?</InlineBtn>
          </p>
        </div>
      </Shell>
    )
  }

  // ── Register ───────────────────────────────────────────────────────────────
  if (screen === 'register') {
    const submit = (e: React.FormEvent) => {
      e.preventDefault(); setError('')
      register.mutate(
        { phone, password: pass, salon_name: salonName, ...(email ? { email } : {}) },
        { onError: handleError }
      )
    }
    return (
      <Shell>
        <Brand subtitle="Create your account" />
        <ModeTabs mode="register" onChange={m => go(m === 'login' ? 'login' : 'register')} />
        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 shadow-[0_8px_40px_rgba(110,27,58,0.10)] border border-line flex flex-col gap-4">
          <Field label="Salon name">
            <input value={salonName} onChange={e => setSalon(e.target.value)} placeholder="e.g. Kez Braids Studio" autoComplete="organization" className={inputCls} />
          </Field>
          <Field label="Phone number">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0277 123 4567" type="tel" autoComplete="tel" className={inputCls} />
          </Field>
          <Field label="Email address (optional)">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" className={inputCls} />
          </Field>
          <Field label="Password">
            <PasswordInput value={pass} onChange={setPass} show={showPw} onToggle={() => setShowPw(p => !p)} autoComplete="new-password" />
            <p className="text-[11px] text-muted mt-[5px] m-0">Minimum 8 characters</p>
          </Field>
          <ErrorBox msg={error} />
          <SubmitBtn disabled={loading || !phone || !pass || !salonName} loading={loading} label="Create account" loadingLabel="Creating account…" />
        </form>
        <div className="mt-4 text-center">
          <p className="text-[11.5px] text-muted m-0">
            Already have an account?{' '}
            <InlineBtn onClick={() => go('login')}>Sign in</InlineBtn>
          </p>
        </div>
      </Shell>
    )
  }

  // ── OTP verify (after register or unverified login) ────────────────────────
  if (screen === 'verify-otp') {
    const submit = (e: React.FormEvent) => {
      e.preventDefault(); setError('')
      verifyPhone.mutate({ phone: otpPhone, code: otp.trim() }, { onError: handleError })
    }
    const resend = () => {
      setError(''); setOtp('')
      sendOtp.mutate({ phone: otpPhone, purpose: 'verify' }, {
        onSuccess: startCountdown,
        onError: handleError,
      })
    }
    return (
      <Shell>
        <Brand subtitle="Verify your phone number" />
        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 shadow-[0_8px_40px_rgba(110,27,58,0.10)] border border-line flex flex-col gap-4">
          <p className="text-[13px] text-muted m-0 leading-relaxed">
            We sent a 6-digit code to <strong className="text-ink">{otpPhone}</strong>. Enter it below to verify your number.
          </p>
          <Field label="Verification code">
            <input
              ref={otpRef}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={cn(inputCls, 'tracking-[0.3em] text-center text-[20px] font-bold')}
            />
          </Field>
          <ErrorBox msg={error} />
          <SubmitBtn disabled={loading || otp.length < 6} loading={loading} label="Verify number" loadingLabel="Verifying…" />
          <div className="text-center">
            {countdown > 0
              ? <p className="text-[12px] text-muted m-0">Resend code in {countdown}s</p>
              : <InlineBtn onClick={resend}>Didn't get the code? Resend</InlineBtn>
            }
          </div>
        </form>
        <div className="mt-4 text-center">
          {otpSource === 'register'
            ? <InlineBtn onClick={() => go('register')}><BackIcon /> Entered the wrong number? Edit it</InlineBtn>
            : <p className="text-[11.5px] text-muted m-0">Verify your number to continue.</p>
          }
        </div>
      </Shell>
    )
  }

  // ── Forgot: enter phone ────────────────────────────────────────────────────
  if (screen === 'forgot-phone') {
    const submit = (e: React.FormEvent) => {
      e.preventDefault(); setError('')
      sendOtp.mutate({ phone, purpose: 'reset' }, {
        onSuccess: () => { setOtpPhone(phone); setScreen('forgot-otp'); startCountdown() },
        onError: handleError,
      })
    }
    return (
      <Shell>
        <Brand subtitle="Reset your password" />
        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 shadow-[0_8px_40px_rgba(110,27,58,0.10)] border border-line flex flex-col gap-4">
          <p className="text-[13px] text-muted m-0 leading-relaxed">Enter the phone number you registered with and we'll send you a 6-digit reset code.</p>
          <Field label="Phone number">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0277 123 4567" type="tel" autoComplete="tel" className={inputCls} />
          </Field>
          <ErrorBox msg={error} />
          <SubmitBtn disabled={loading || !phone} loading={loading} label="Send reset code" loadingLabel="Sending…" />
        </form>
        <div className="mt-4 text-center">
          <InlineBtn onClick={() => go('login')}><BackIcon /> Back to sign in</InlineBtn>
        </div>
      </Shell>
    )
  }

  // ── Forgot: enter OTP ─────────────────────────────────────────────────────
  if (screen === 'forgot-otp') {
    const submit = (e: React.FormEvent) => {
      e.preventDefault()
      if (otp.length === 6) { setError(''); setScreen('forgot-newpw') }
    }
    const resend = () => {
      setError(''); setOtp('')
      sendOtp.mutate({ phone: otpPhone, purpose: 'reset' }, {
        onSuccess: startCountdown,
        onError: handleError,
      })
    }
    return (
      <Shell>
        <Brand subtitle="Enter your reset code" />
        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 shadow-[0_8px_40px_rgba(110,27,58,0.10)] border border-line flex flex-col gap-4">
          <p className="text-[13px] text-muted m-0 leading-relaxed">
            We sent a code to <strong className="text-ink">{otpPhone}</strong>.
          </p>
          <Field label="Reset code">
            <input
              ref={otpRef}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={cn(inputCls, 'tracking-[0.3em] text-center text-[20px] font-bold')}
            />
          </Field>
          <ErrorBox msg={error} />
          <SubmitBtn disabled={otp.length < 6} loading={false} label="Continue" loadingLabel="…" />
          <div className="text-center">
            {countdown > 0
              ? <p className="text-[12px] text-muted m-0">Resend in {countdown}s</p>
              : <InlineBtn onClick={resend}>Resend code</InlineBtn>
            }
          </div>
        </form>
        <div className="mt-4 text-center">
          <InlineBtn onClick={() => go('forgot-phone')}><BackIcon /> Change number</InlineBtn>
        </div>
      </Shell>
    )
  }

  // ── Forgot: new password ──────────────────────────────────────────────────
  if (screen === 'forgot-newpw') {
    const submit = (e: React.FormEvent) => {
      e.preventDefault(); setError('')
      resetPw.mutate({ phone: otpPhone, code: otp, new_password: newPass }, { onError: handleError })
    }
    return (
      <Shell>
        <Brand subtitle="Set a new password" />
        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 shadow-[0_8px_40px_rgba(110,27,58,0.10)] border border-line flex flex-col gap-4">
          <Field label="New password">
            <PasswordInput value={newPass} onChange={setNewPass} show={showNewPw} onToggle={() => setShowNewPw(p => !p)} autoComplete="new-password" />
            <p className="text-[11px] text-muted mt-[5px] m-0">Minimum 8 characters</p>
          </Field>
          <ErrorBox msg={error} />
          <SubmitBtn disabled={loading || newPass.length < 8} loading={loading} label="Set new password" loadingLabel="Saving…" />
        </form>
      </Shell>
    )
  }

  return null
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const inputCls = 'w-full border border-line rounded-[14px] px-[14px] py-[13px] text-[14px] text-ink placeholder:text-muted outline-none focus:border-plum transition-colors bg-white'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: 'radial-gradient(120% 120% at 80% 0%,#F3DDE2 0%,#EFE6E1 38%,#E9E0DC 100%)' }}>
      <div className="w-full max-w-[400px]" style={{ animation: 'bosUp 0.5s ease both' }}>
        {children}
      </div>
    </div>
  )
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="w-[72px] h-[72px] rounded-full bg-plum flex items-center justify-center shadow-[0_8px_28px_rgba(110,27,58,0.28)] mb-4">
        <span className="font-serif font-semibold text-[28px] text-white">K</span>
      </div>
      <h1 className="font-serif font-medium text-[28px] text-ink m-0">BraiderOS</h1>
      <p className="text-[13px] text-muted mt-[5px] m-0">{subtitle}</p>
    </div>
  )
}

function ModeTabs({ mode, onChange }: { mode: 'login' | 'register'; onChange: (m: 'login' | 'register') => void }) {
  return (
    <div className="flex bg-white/70 rounded-[16px] p-[4px] mb-4 border border-line">
      {(['login', 'register'] as const).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            'flex-1 h-[38px] rounded-[12px] text-[13px] font-semibold border-none cursor-pointer transition-all',
            mode === m ? 'bg-plum text-white shadow-sm' : 'bg-transparent text-muted hover:text-ink'
          )}
        >
          {m === 'login' ? 'Sign in' : 'Register'}
        </button>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11.5px] font-semibold text-muted block mb-[7px]">{label}</label>
      {children}
    </div>
  )
}

function PasswordInput({ value, onChange, show, onToggle, autoComplete }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; autoComplete?: string
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="••••••••••"
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        className={cn(inputCls, 'pr-[44px]')}
      />
      <button type="button" onClick={onToggle} className="absolute right-[13px] top-1/2 -translate-y-1/2 text-muted bg-transparent border-none cursor-pointer p-0 hover:text-ink transition-colors">
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null
  return <div className="text-[12px] text-draft bg-[#FFF8EE] border border-draft/20 rounded-[12px] px-[13px] py-[10px] leading-snug">{msg}</div>
}

function SubmitBtn({ disabled, loading, label, loadingLabel }: { disabled: boolean; loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        'w-full h-[50px] rounded-[14px] font-bold text-[15px] border-none cursor-pointer transition-all mt-1',
        disabled ? 'bg-surface-2 text-muted cursor-not-allowed' : 'bg-plum text-white shadow-[0_4px_16px_rgba(110,27,58,0.28)] hover:opacity-90'
      )}
    >
      {loading ? loadingLabel : label}
    </button>
  )
}

function InlineBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} type="button" className="text-plum font-semibold bg-transparent border-none cursor-pointer hover:opacity-80 inline-flex items-center gap-1">
      {children}
    </button>
  )
}
