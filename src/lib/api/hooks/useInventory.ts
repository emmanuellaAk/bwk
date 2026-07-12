import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../base'
import { tokenStore } from '../token'

export interface StockItemRecord {
  id: string
  color: string
  length: string
  packs: number
  max_packs: number
  price_per_pack: number
  status: 'low' | 'ok' | 'good'
  created_at: string
  updated_at: string
}

const KEY = ['inventory'] as const

export function useInventory() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<StockItemRecord[]>('/v1/inventory'),
    enabled: !!tokenStore.get(),
    staleTime: 60_000,
  })
}

export function useCreateStockItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      color: string
      length: string
      packs?: number
      max_packs?: number
      price_per_pack: number
    }) => api.post<StockItemRecord>('/v1/inventory', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRestockItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity, supplier_id }: { id: string; quantity: number; supplier_id?: string }) =>
      api.post<StockItemRecord>(`/v1/inventory/${id}/restock`, { quantity, supplier_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateStockItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; packs?: number; max_packs?: number; price_per_pack?: number }) =>
      api.patch<StockItemRecord>(`/v1/inventory/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
