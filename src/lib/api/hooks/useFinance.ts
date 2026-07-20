import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../base'
import { tokenStore } from '../token'

export type Period = 'week' | 'month' | 'year'
export type TransactionKind = 'income' | 'expense'

export interface FinanceSummary {
  period: Period
  revenue: number
  expenses: number
  profit: number
  delta_pct: number | null
}

export interface DayCount {
  day: string   // "Mon" … "Sat"
  count: number
}

export interface MonthlyPoint {
  month: string
  year: number
  revenue: number
}

export interface TopService {
  service_name: string
  bookings: number
  revenue: number
}

export interface TransactionRecord {
  id: string
  kind: TransactionKind
  amount: number
  description: string
  appointment_id: string | null
  occurred_at: string
  created_at: string
}

export interface OutstandingRecord {
  appointment_id: string
  client_name: string | null
  service_name: string | null
  total_price: number
  deposit_paid: number
  balance_due: number
  starts_at: string
}

const enabled = () => !!tokenStore.get()

export function useFinanceSummary(period: Period) {
  return useQuery({
    queryKey: ['finance', 'summary', period],
    queryFn: () => api.get<FinanceSummary>(`/v1/finance/summary?period=${period}`),
    enabled: enabled(),
    staleTime: 60_000,
  })
}

export function useMonthlyRevenue(months = 6) {
  return useQuery({
    queryKey: ['finance', 'monthly', months],
    queryFn: () => api.get<MonthlyPoint[]>(`/v1/finance/monthly?months=${months}`),
    enabled: enabled(),
    staleTime: 300_000,
  })
}

export function useTopServices(limit = 5) {
  return useQuery({
    queryKey: ['finance', 'top-services', limit],
    queryFn: () => api.get<TopService[]>(`/v1/finance/top-services?limit=${limit}`),
    enabled: enabled(),
    staleTime: 300_000,
  })
}

export function useTransactions(limit = 20) {
  return useQuery({
    queryKey: ['finance', 'transactions', limit],
    queryFn: () => api.get<TransactionRecord[]>(`/v1/finance/transactions?limit=${limit}`),
    enabled: enabled(),
    staleTime: 60_000,
  })
}

export function useOutstanding() {
  return useQuery({
    queryKey: ['finance', 'outstanding'],
    queryFn: () => api.get<OutstandingRecord[]>('/v1/finance/outstanding'),
    enabled: enabled(),
    staleTime: 60_000,
  })
}

export function useBusiestDays() {
  return useQuery({
    queryKey: ['finance', 'busiest-days'],
    queryFn: () => api.get<DayCount[]>('/v1/finance/busiest-days'),
    enabled: enabled(),
    staleTime: 300_000,
  })
}

export function useLogTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      kind: TransactionKind
      amount: number
      description: string
      appointment_id?: string
      occurred_at: string
    }) => api.post<TransactionRecord>('/v1/finance/transactions', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}
