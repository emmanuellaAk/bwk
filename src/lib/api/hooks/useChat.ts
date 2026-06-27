import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { Booking, BookingDraft } from '../types'

export interface ChatEntry {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
  booking?: Booking
}

let msgCounter = 0
function nextId(role: 'u' | 'a') {
  return `msg-${++msgCounter}-${role}`
}

export function useChat() {
  const [messages, setMessages] = useState<ChatEntry[]>([])

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (text: string) => {
      const userId = nextId('u')
      const aiId = nextId('a')

      setMessages(prev => [
        ...prev,
        { id: userId, role: 'user', text },
        { id: aiId, role: 'assistant', text: '', streaming: true },
      ])

      let pendingBooking: Booking | undefined

      for await (const chunk of apiClient.streamMessage(text)) {
        if (chunk.token !== undefined) {
          const token = chunk.token
          setMessages(prev =>
            prev.map(m => m.id === aiId ? { ...m, text: m.text + token } : m)
          )
        }
        if (chunk.booking) {
          pendingBooking = chunk.booking
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === aiId
            ? { ...m, streaming: false, booking: pendingBooking }
            : m
        )
      )
    },
  })

  const confirmBooking = useCallback(async (bookingId: string, draft: BookingDraft) => {
    const confirmed = await apiClient.confirmBooking(bookingId, draft)
    setMessages(prev =>
      prev.map(m =>
        m.booking?.id === bookingId ? { ...m, booking: confirmed } : m
      )
    )
    return confirmed
  }, [])

  return { messages, sendMessage, isPending, confirmBooking }
}
