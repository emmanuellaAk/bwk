import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { Nudge } from '../types'

export function useNudges() {
  const qc = useQueryClient()

  const { data: nudges = [] } = useQuery({
    queryKey: ['nudges'],
    queryFn: () => apiClient.getNudges(),
  })

  const { mutate: dismissNudge } = useMutation({
    mutationFn: (id: string) => apiClient.dismissNudge(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['nudges'] })
      const prev = qc.getQueryData<Nudge[]>(['nudges'])
      qc.setQueryData<Nudge[]>(['nudges'], old => old?.filter(n => n.id !== id) ?? [])
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['nudges'], ctx.prev)
    },
  })

  const { mutate: actOnNudge } = useMutation({
    mutationFn: (id: string) => apiClient.actOnNudge(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['nudges'] })
      const prev = qc.getQueryData<Nudge[]>(['nudges'])
      qc.setQueryData<Nudge[]>(['nudges'], old =>
        old?.map(n => n.id === id ? { ...n, acted: true } : n) ?? []
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['nudges'], ctx.prev)
    },
  })

  return { nudges, dismissNudge, actOnNudge }
}
