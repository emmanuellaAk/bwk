import { useMutation } from '@tanstack/react-query'
import { api, toE164 } from '../base'
import { tokenStore } from '../token'
import { salonStore } from '../salon'

interface TokenResponse {
  access_token: string
  is_phone_verified: boolean
}

export function useLogin(onSuccess: (verified: boolean) => void) {
  return useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      const data = await api.post<TokenResponse>('/v1/auth/login', { phone: toE164(phone), password })
      tokenStore.set(data.access_token)
      salonStore.setFromToken(data.access_token)
      return data
    },
    onSuccess: (data) => onSuccess(data.is_phone_verified),
  })
}

export function useRegister(onSuccess: (verified: boolean, phone: string) => void) {
  return useMutation({
    mutationFn: async ({ phone, password, salon_name, email }: { phone: string; password: string; salon_name: string; email?: string }) => {
      const data = await api.post<TokenResponse>('/v1/auth/register', {
        phone: toE164(phone),
        password,
        salon_name,
        ...(email ? { email } : {}),
      })
      tokenStore.set(data.access_token)
      salonStore.setFromToken(data.access_token)
      return { ...data, phone: toE164(phone) }
    },
    onSuccess: (data) => onSuccess(data.is_phone_verified, data.phone),
  })
}

export function useSendOtp() {
  return useMutation({
    mutationFn: ({ phone, purpose }: { phone: string; purpose: 'verify' | 'reset' }) =>
      api.post<void>('/v1/auth/send-otp', { phone: toE164(phone), purpose }),
  })
}

export function useVerifyPhone(onSuccess: () => void) {
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      api.post<void>('/v1/auth/verify-phone', { phone, code }),
    onSuccess,
  })
}

export function useResetPassword(onSuccess: () => void) {
  return useMutation({
    mutationFn: ({ phone, code, new_password }: { phone: string; code: string; new_password: string }) =>
      api.post<void>('/v1/auth/reset-password', { phone, code, new_password }),
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
