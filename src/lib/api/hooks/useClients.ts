import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../base'

export interface ClientRecord {
  id: string
  salon_id: string
  name: string
  phone: string | null
  notes: string | null
  color_hex: string
  created_at: string
  updated_at: string
}

export interface ClientAppointment {
  id: string
  starts_at: string
  ends_at: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  service_name: string | null
  total_price: number
  deposit_paid: number
}

interface ClientPage {
  items: ClientRecord[]
  next_cursor: string | null
}

export function useClients(search?: string) {
  const params = search ? `?search=${encodeURIComponent(search)}` : ''
  return useQuery({
    queryKey: ['clients', search ?? ''],
    queryFn: () => api.get<ClientPage>(`/v1/clients${params}`),
    staleTime: 30_000,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; phone?: string; notes?: string; color_hex?: string }) =>
      api.post<ClientRecord>('/v1/clients', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useClientAppointments(id: string | null) {
  return useQuery({
    queryKey: ['clients', id, 'appointments'],
    queryFn: () => api.get<ClientAppointment[]>(`/v1/clients/${id}/appointments`),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; phone?: string; notes?: string; color_hex?: string }) =>
      api.patch<ClientRecord>(`/v1/clients/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/v1/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}
