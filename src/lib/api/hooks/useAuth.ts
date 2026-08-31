import { useMutation } from '@tanstack/react-query'
import { api, toE164 } from '../base'
import { tokenStore } from '../token'
import { salonStore } from '../salon'

interface TokenResponse {
  access_token: string
  is_phone_verified: boolean
}

export function useLogin(onSuccess: (verified: boolean, phone: string) => void) {
  return useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      const data = await api.post<TokenResponse>('/v1/auth/login', { phone: toE164(phone), password })
      tokenStore.set(data.access_token)
      salonStore.setFromToken(data.access_token)
      return { ...data, phone: toE164(phone) }
    },
    onSuccess: (data) => onSuccess(data.is_phone_verified, data.phone),
  })
}

// Register only stages the signup — no account exists, no tokens issued,
// until the phone is verified. So there's nothing to log in with yet; we
// just hand back the normalized phone so the caller can route to the OTP screen.
export function useRegister(onSuccess: (phone: string) => void) {
  return useMutation({
    mutationFn: async ({ phone, password, salon_name, email }: { phone: string; password: string; salon_name: string; email?: string }) => {
      const normPhone = toE164(phone)
      await api.post<void>('/v1/auth/register', {
        phone: normPhone,
        password,
        salon_name,
        ...(email ? { email } : {}),
      })
      return normPhone
    },
    onSuccess,
  })
}

export function useSendOtp() {
  return useMutation({
    mutationFn: ({ phone, purpose }: { phone: string; purpose: 'verify' | 'reset' }) =>
      api.post<void>('/v1/auth/send-otp', { phone: toE164(phone), purpose }),
  })
}

// Verifying the phone is what actually creates the account (for a fresh
// signup) or finishes verifying an existing one — either way, this is the
// point tokens get issued.
export function useVerifyPhone(onSuccess: () => void) {
  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const data = await api.post<TokenResponse>('/v1/auth/verify-phone', { phone: toE164(phone), code })
      tokenStore.set(data.access_token)
      salonStore.setFromToken(data.access_token)
      return data
    },
    onSuccess,
  })
}

export function useResetPassword(onSuccess: () => void) {
  return useMutation({
    mutationFn: ({ phone, code, new_password }: { phone: string; code: string; new_password: string }) =>
      api.post<void>('/v1/auth/reset-password', { phone: toE164(phone), code, new_password }),
    onSuccess,
  })
}

export function useLogout(onSuccess: () => void) {
  return useMutation({
    mutationFn: async () => {
      await api.post('/v1/auth/logout')
      tokenStore.clear()
    },
    onSuccess,
  })
}
