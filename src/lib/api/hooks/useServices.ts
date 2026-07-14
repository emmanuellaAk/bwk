import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../base'
import { tokenStore } from '../token'

export interface ServiceRecord {
  id: string
  salon_id: string
  name: string
  duration_minutes: number
  price: number
  deposit_pct: number
  created_at: string
  updated_at: string
}

const KEY = ['services'] as const

export function useServices() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<ServiceRecord[]>('/v1/services'),
    enabled: !!tokenStore.get(),
    staleTime: 60_000,
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; duration_minutes: number; price: number; deposit_pct?: number }) =>
      api.post<ServiceRecord>('/v1/services', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; duration_minutes?: number; price?: number; deposit_pct?: number }) =>
      api.patch<ServiceRecord>(`/v1/services/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/v1/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
