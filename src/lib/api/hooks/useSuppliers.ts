import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../base'
import { tokenStore } from '../token'

export interface PurchaseLine {
  id: string
  stock_item_id: string | null
  color: string | null
  length: string | null
  quantity: number
  price_per_pack: number
  total: number
  occurred_at: string
}

export interface SupplierSummary {
  id: string
  name: string
  location: string | null
  contact_phone: string | null
  total_spent: number
  order_count: number
  last_order_at: string | null
  created_at: string
}

export interface SupplierDetail extends SupplierSummary {
  purchases: PurchaseLine[]
}

const KEY = ['suppliers'] as const

export function useSuppliers() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<SupplierSummary[]>('/v1/suppliers'),
    enabled: !!tokenStore.get(),
    staleTime: 60_000,
  })
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get<SupplierDetail>(`/v1/suppliers/${id}`),
    enabled: !!tokenStore.get() && !!id,
    staleTime: 30_000,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; location?: string; contact_phone?: string }) =>
      api.post<SupplierSummary>('/v1/suppliers', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function usePlaceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      supplierId,
      items,
    }: {
      supplierId: string
      items: { stock_item_id: string; quantity: number; price_per_pack: number }[]
    }) => api.post<PurchaseLine[]>(`/v1/suppliers/${supplierId}/orders`, { items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
