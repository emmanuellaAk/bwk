import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../base'
import { tokenStore } from '../token'

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface AppointmentRecord {
  id: string
  salon_id: string
  client_id: string
  service_id: string | null
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  color_hex: string
  notes: string | null
  deposit_paid: number
  total_price: number
  client_name: string | null
  service_name: string | null
  created_at: string
  updated_at: string
}

export function useAppointments(from: Date, to: Date, status?: AppointmentStatus) {
  const fromIso = from.toISOString()
  const toIso = to.toISOString()
  return useQuery({
    queryKey: ['appointments', fromIso, toIso, status ?? null],
    queryFn: () => {
      const p = new URLSearchParams({ from: fromIso, to: toIso })
      if (status) p.set('status', status)
      return api.get<AppointmentRecord[]>(`/v1/appointments?${p}`)
    },
    enabled: !!tokenStore.get(),
    staleTime: 60_000,
  })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      client_id: string
      service_id?: string
      starts_at: string
      ends_at: string
      color_hex?: string
      notes?: string
      deposit_paid?: number
      total_price: number
    }) => api.post<AppointmentRecord>('/v1/appointments', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch<AppointmentRecord>(`/v1/appointments/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useCancelAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/v1/appointments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
