import { useMutation } from '@tanstack/react-query'
import { api, toE164 } from '../base'
import { tokenStore } from '../token'

interface TokenResponse { access_token: string }

export function useLogin(onSuccess: () => void) {
  return useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      const data = await api.post<TokenResponse>('/v1/auth/login', {
        phone: toE164(phone),
        password,
      })
      tokenStore.set(data.access_token)
    },
    onSuccess,
  })
}

export function useRegister(onSuccess: () => void) {
  return useMutation({
    mutationFn: async ({ phone, password, salon_name }: { phone: string; password: string; salon_name: string }) => {
      const data = await api.post<TokenResponse>('/v1/auth/register', {
        phone: toE164(phone),
        password,
        salon_name,
      })
      tokenStore.set(data.access_token)
    },
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
