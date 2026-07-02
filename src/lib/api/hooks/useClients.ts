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
