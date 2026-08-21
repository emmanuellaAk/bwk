import { useRef, useEffect, useState } from 'react'
import { useChat } from '@/lib/api/hooks/useChat'
import { useNudges } from '@/lib/api/hooks/useNudges'
import { ProactiveNudgeCard } from './ProactiveNudgeCard'
import { BookingCard } from './BookingCard'
import { EarningsMiniCard } from './EarningsMiniCard'
import { AvailConfirmCard } from './AvailConfirmCard'
import { Composer } from './Composer'

const LogoAvatar = () => (
  <div className="relative">
    <div className="w-[74px] h-[74px] rounded-full bg-plum flex items-center justify-center shadow-[0_8px_26px_rgba(110,27,58,0.20)]">
      <span className="font-serif font-semibold text-[28px] text-white">K</span>
    </div>
    <span className="absolute right-[-3px] top-[-3px] bg-plum text-white text-[9px] font-bold px-[7px] py-[3px] rounded-[20px] tracking-[0.5px] shadow-[0_2px_6px_rgba(110,27,58,0.3)]">
      AI
    </span>
  </div>
)

const SmallAvatar = () => (
  <div className="w-7 h-7 rounded-full bg-plum flex items-center justify-center flex-none mt-[2px]">
    <span className="font-serif font-semibold text-[11px] text-white">K</span>
  </div>
)

const TypingDots = () => (
  <span className="inline-flex gap-1 p-[3px_2px]">
    {[0, 0.15, 0.3].map((delay, i) => (
      <span
        key={i}
        className="w-[7px] h-[7px] rounded-full bg-muted"
        style={{ animation: `bosDot 1s infinite ${delay}s` }}
      />
    ))}
  </span>
)

const Cursor = () => (
  <span
    className="inline-block w-[2px] h-[15px] bg-plum ml-[2px] align-[-2px]"
    style={{ animation: 'bosBlink 1s steps(1) infinite' }}
  />
)

export function ChatHome() {
  const { messages, sessions, activeSessionId, selectSession, newSession, renameSession, deleteSession, sendMessage, isPending, confirmBooking } = useChat()
  const { nudges, dismissNudge, actOnNudge } = useNudges()
  const feedRef = useRef<HTMLDivElement>(null)
  const [renaming, setRenaming] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')

  useEffect(() => {
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, nudges])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning, Kez'
    if (h < 17) return 'Good afternoon, Kez'
    return 'Good evening, Kez'
  })()

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-none flex items-center gap-2 px-4 py-3 bg-canvas border-b border-line">
        <select
          value={activeSessionId ?? ''}
          onChange={event => { setRenaming(false); selectSession(event.target.value || null) }}
          className="min-w-0 flex-1 bg-white border border-line rounded-[11px] px-3 py-[9px] text-[12.5px] font-semibold text-ink outline-none shadow-[0_1px_5px_rgba(34,27,30,0.04)]"
          aria-label="Chat session"
        >
          {!activeSessionId && <option value="">New chat</option>}
          {sessions.map(session => <option key={session.id} value={session.id}>{session.title}</option>)}
        </select>
        {activeSessionId && (renaming ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={sessionTitle}
              onChange={event => setSessionTitle(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') { renameSession(activeSessionId, sessionTitle); setRenaming(false) } }}
              className="w-[136px] bg-white border border-line rounded-[10px] px-2.5 py-[8px] text-[12px] text-ink outline-none"
              aria-label="Session name"
            />
            <button onClick={() => { renameSession(activeSessionId, sessionTitle); setRenaming(false) }} className="bg-plum text-white border-none rounded-[10px] px-3 py-[8px] text-[11.5px] font-bold cursor-pointer">Save</button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5">
            <button onClick={() => { setSessionTitle(sessions.find(session => session.id === activeSessionId)?.title ?? ''); setRenaming(true) }} className="bg-white text-muted border border-line rounded-[10px] px-3 py-[8px] text-[11.5px] font-semibold cursor-pointer hover:text-ink">Rename</button>
            <button onClick={() => deleteSession(activeSessionId)} className="bg-white text-draft border border-line rounded-[10px] px-3 py-[8px] text-[11.5px] font-semibold cursor-pointer">Delete</button>
          </div>
        ))}
        <button
          onClick={newSession}
          className="flex-none bg-plum text-white border-none rounded-[11px] px-3.5 py-[9px] text-[12px] font-bold cursor-pointer shadow-[0_6px_16px_rgba(106,24,56,0.14)]"
        >
          New chat
        </button>
      </div>
      {/* Scrollable feed */}
      <div ref={feedRef} className="flex-1 min-h-0 overflow-y-auto bos-scroll">
        <div className="flex flex-col gap-[12px] px-4 md:px-6 py-6 max-w-[760px] mx-auto">

          {/* Greeting */}
          <div className="flex flex-col items-center text-center pt-4 pb-8" style={{ animation: 'bosUp 0.5s ease both' }}>
            <div className="mb-[14px]">
              <LogoAvatar />
            </div>
            <h1 className="font-serif font-medium text-[25px] leading-[1.22] m-0 max-w-[300px] text-ink">
              {greeting}
            </h1>
            <p className="mt-3 text-[13.5px] text-muted max-w-[340px] leading-[1.65]">
              Ask about bookings, revenue, stock, or reminders. I’ll keep the answer concise and act on the details.
            </p>
          </div>

          {/* Proactive nudge cards */}
          {nudges.map(nudge => (
            <ProactiveNudgeCard
              key={nudge.id}
              nudge={nudge}
              onAct={() => actOnNudge(nudge.id)}
              onDismiss={() => dismissNudge(nudge.id)}
            />
          ))}

          {/* Chat messages */}
          {messages.map(msg => {
            if (msg.role === 'user') {
              return (
                <div
                  key={msg.id}
                  className="self-end max-w-[82%] bg-plum text-white px-[16px] py-3 rounded-[18px_18px_6px_18px] text-[14px] leading-[1.55] whitespace-pre-wrap shadow-[0_8px_20px_rgba(106,24,56,0.16)]"
                  style={{ animation: 'bosUp 0.3s ease both' }}
                >
                  {msg.text}
                </div>
              )
            }

            return (
              <div key={msg.id} className="flex flex-col gap-[10px]" style={{ animation: 'bosUp 0.3s ease both' }}>
                {/* AI text bubble */}
                {(msg.text || msg.streaming) && (
                  <div className="self-start flex gap-[9px] max-w-[90%]">
                    <SmallAvatar />
                    <div className="bg-white text-ink px-[16px] py-3 rounded-[6px_18px_18px_18px] text-[14px] leading-[1.6] shadow-[0_1px_10px_rgba(34,27,30,0.06)] border border-line">
                      {msg.streaming && !msg.text ? (
                        <TypingDots />
                      ) : (
                        <>
                          <span className="whitespace-pre-wrap">{msg.text}</span>
                          {msg.streaming && <Cursor />}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking card */}
                {msg.booking && (
                  <div className="ml-[37px] w-[min(360px,90%)]">
                    <BookingCard booking={msg.booking} onConfirm={confirmBooking} />
                  </div>
                )}

                {/* Earnings card */}
                {msg.earnings && <EarningsMiniCard {...msg.earnings} />}

                {/* Availability confirm */}
                {msg.avail && <AvailConfirmCard {...msg.avail} />}
              </div>
            )
          })}

          <div className="h-[6px]" />
        </div>
      </div>

      {/* Composer */}
      <Composer onSend={text => sendMessage(text)} disabled={isPending} />
    </div>
  )
}
