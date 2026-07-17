import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../base'
import { tokenStore } from '../token'

export interface SettingsRecord {
  id: string
  salon_name: string
  owner_name: string | null
  hours_open: string | null
  hours_close: string | null
  default_deposit_pct: number
  updated_at: string
}

const KEY = ['settings'] as const

export function useSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<SettingsRecord>('/v1/settings'),
    enabled: !!tokenStore.get(),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Omit<SettingsRecord, 'id' | 'updated_at'>>) =>
      api.patch<SettingsRecord>('/v1/settings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
