import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { Booking, BookingDraft, ChatEntry } from '../types'

export type { ChatEntry }

export interface EarningsData {
  delta: string; revenue: string; expenses: string; completed: number; profit: string
}
export interface AvailData { title: string; body: string }

export interface ChatMessage extends ChatEntry {
  booking?: Booking
  earnings?: EarningsData
  avail?: AvailData
}

let msgCounter = 0
function nextId(role: 'u' | 'a') {
  return `msg-${++msgCounter}-${role}`
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (text: string) => {
      const history = messages
      const userId  = nextId('u')
      const aiId    = nextId('a')

      setMessages(prev => [
        ...prev,
        { id: userId, role: 'user',      text },
        { id: aiId,   role: 'assistant', text: '', streaming: true },
      ])

      let pendingBooking:  Booking             | undefined
      let pendingEarnings: ChatMessage['earnings'] | undefined
      let pendingAvail:    ChatMessage['avail']    | undefined

      for await (const chunk of apiClient.streamMessage(text, history)) {
        if (chunk.token !== undefined) {
          const token = chunk.token
          setMessages(prev =>
            prev.map(m => m.id === aiId ? { ...m, text: m.text + token } : m)
          )
        }
        if (chunk.booking)  pendingBooking  = chunk.booking
        if (chunk.earnings) pendingEarnings = chunk.earnings
        if (chunk.avail)    pendingAvail    = chunk.avail
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === aiId
            ? { ...m, streaming: false, booking: pendingBooking, earnings: pendingEarnings, avail: pendingAvail }
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
