import { useState, useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../client'
import { salonStore } from '../salon'
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

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

let msgCounter = 0
function nextId(role: 'u' | 'a') {
  return `msg-${Date.now()}-${++msgCounter}-${role}`
}

function sessionsStorageKey() {
  return `braider-chat-sessions-v2:${salonStore.get() ?? 'guest'}`
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(sessionsStorageKey())
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatSession[]
    return Array.isArray(parsed) ? parsed.filter(session => session.messages?.length > 0) : []
  } catch {
    return []
  }
}

function parseInventoryPurchase(text: string) {
  const match = text.match(/\bbought\s+(\d+)\s+(?:packs?|pacs?)\s+of\s+(.+?)\s+(?:and\s+)?(?:they\s+)?(?:were|cost|for)\s+(?:gh₵|ghs?\s*)?(\d+(?:\.\d+)?)\s*(?:cedis?|ghs?|gh₵)?\b/i)
  if (!match) return null
  const words = match[2].trim().replace(/[,.]$/, '').split(/\s+/)
  if (words.length < 2) return null
  return {
    color: words.slice(0, -1).join(' '),
    length: words.at(-1) ?? '',
    quantity: Number(match[1]),
    total_price: Number(match[3]),
  }
}

export function useChat() {
  const storageKey = sessionsStorageKey()
  const initialSessions = loadSessions()
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => sessions[0]?.id ?? null)

  const activeSession = sessions.find(session => session.id === activeSessionId)
  const messages = activeSession?.messages ?? []

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sessions))
    } catch {
      // Chat history is a convenience; storage failures must not block chat.
    }
  }, [sessions, storageKey])

  const updateMessages = (updater: (current: ChatMessage[]) => ChatMessage[], targetId = activeSessionId) => {
    const id = targetId
    if (!id) return
    setSessions(prev => prev.map(session => {
      if (session.id !== id) return session
      const messages = updater(session.messages)
      const firstUser = messages.find(message => message.role === 'user')
      return {
        ...session,
        title: session.title === 'New chat' && firstUser ? firstUser.text.slice(0, 32) : session.title,
        messages,
        updatedAt: new Date().toISOString(),
      }
    }))
  }

  const newSession = () => {
    setActiveSessionId(null)
  }

  const renameSession = (id: string, title: string) => {
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    setSessions(prev => prev.map(session => session.id === id ? { ...session, title: cleanTitle, updatedAt: new Date().toISOString() } : session))
  }

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const remaining = prev.filter(session => session.id !== id)
      if (activeSessionId === id) setActiveSessionId(remaining[0]?.id ?? null)
      return remaining
    })
  }

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (text: string) => {
      const history = messages
      const userId  = nextId('u')
      const aiId    = nextId('a')
      const sessionId = activeSessionId ?? `session-${Date.now()}`

      if (!activeSessionId) {
        const now = new Date().toISOString()
        setSessions(prev => [{ id: sessionId, title: 'New chat', createdAt: now, updatedAt: now, messages: [] }, ...prev])
        setActiveSessionId(sessionId)
      }

      updateMessages(prev => [
        ...prev,
        { id: userId, role: 'user',      text },
        { id: aiId,   role: 'assistant', text: '', streaming: true },
      ], sessionId)

      const inventoryPurchase = parseInventoryPurchase(text)
      if (inventoryPurchase) {
        try {
          await apiClient.recordInventoryPurchase(inventoryPurchase)
        } catch {
          updateMessages(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false, text: 'I could not update inventory. Please try again.' } : m), sessionId)
          return
        }
      }

      let pendingBooking:  Booking             | undefined
      let pendingEarnings: ChatMessage['earnings'] | undefined
      let pendingAvail:    ChatMessage['avail']    | undefined

      try {
        for await (const chunk of apiClient.streamMessage(text, history)) {
          if (chunk.token !== undefined) {
            const token = chunk.token
            updateMessages(prev =>
              prev.map(m => m.id === aiId ? { ...m, text: m.text + token } : m)
            , sessionId)
          }
          if (chunk.booking)  pendingBooking  = chunk.booking
          if (chunk.earnings) pendingEarnings = chunk.earnings
          if (chunk.avail)    pendingAvail    = chunk.avail
        }

        updateMessages(prev =>
          prev.map(m =>
            m.id === aiId
              ? { ...m, streaming: false, booking: pendingBooking, earnings: pendingEarnings, avail: pendingAvail }
              : m
          ), sessionId
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The assistant is temporarily unavailable. Please try again.'
        updateMessages(prev =>
          prev.map(m => m.id === aiId ? { ...m, streaming: false, text: m.text || message } : m)
        , sessionId)
      }
    },
  })

  const confirmBooking = useCallback(async (bookingId: string, draft: BookingDraft) => {
    const confirmed = await apiClient.confirmBooking(bookingId, draft)
    setSessions(prev => prev.map(session => ({
      ...session,
      messages: session.messages.map(m => m.booking?.id === bookingId ? { ...m, booking: confirmed } : m),
    })))
    return confirmed
  }, [])

  return { messages, sessions, activeSessionId, selectSession: setActiveSessionId, newSession, renameSession, deleteSession, sendMessage, isPending, confirmBooking }
}
