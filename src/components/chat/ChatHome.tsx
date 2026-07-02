import { useRef, useEffect } from 'react'
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
  const { messages, sendMessage, isPending, confirmBooking } = useChat()
  const { nudges, dismissNudge, actOnNudge } = useNudges()
  const feedRef = useRef<HTMLDivElement>(null)

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
    <div className="flex flex-col h-full">
      {/* Scrollable feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto bos-scroll">
        <div className="flex flex-col gap-[11px] px-[14px] py-[14px] max-w-[680px] mx-auto">

          {/* Greeting */}
          <div className="flex flex-col items-center text-center pt-[14px] pb-[22px]" style={{ animation: 'bosUp 0.5s ease both' }}>
            <div className="mb-[14px]">
              <LogoAvatar />
            </div>
            <h1 className="font-serif font-medium text-[25px] leading-[1.22] m-0 max-w-[300px] text-ink">
              {greeting}
            </h1>
            <p className="mt-[9px] text-[13.5px] text-muted max-w-[288px] leading-[1.5]">
              Tell me what you need done — bookings, money, stock, reminders. I'll handle the operations.
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
                  className="self-end max-w-[82%] bg-plum text-white px-[15px] py-3 rounded-[20px_20px_5px_20px] text-[14px] leading-[1.5] whitespace-pre-wrap shadow-[0_4px_14px_rgba(110,27,58,0.18)]"
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
                    <div className="bg-surface text-ink px-[15px] py-3 rounded-[5px_20px_20px_20px] text-[14px] leading-[1.55] shadow-[0_3px_14px_rgba(110,27,58,0.07)] border border-line">
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
