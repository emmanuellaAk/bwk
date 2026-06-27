import type { Nudge } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface Props {
  nudge: Nudge
  onAct: () => void
  onDismiss: () => void
}

const BellIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
  </svg>
)

const BoxIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8 12 3 3 8l9 5 9-5z"/>
    <path d="M3 8v8l9 5 9-5V8"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

export function ProactiveNudgeCard({ nudge, onAct, onDismiss }: Props) {
  const isDone = nudge.acted

  return (
    <div
      className="self-start w-full bg-surface border border-line rounded-[5px_18px_18px_18px] p-[14px_15px] shadow-[0_4px_16px_rgba(110,27,58,0.08)]"
      style={{
        borderLeft: `3px solid ${nudge.accent}`,
        animation: 'bosUp 0.4s ease both',
      }}
    >
      <div className="flex items-start gap-[11px]">
        {/* Icon */}
        <span
          className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-none"
          style={{ background: nudge.tint, color: nudge.accent }}
        >
          {nudge.type === 'reminder' ? <BellIcon /> : <BoxIcon />}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span
            className="text-[9.5px] font-bold uppercase tracking-[0.6px]"
            style={{ color: nudge.accent }}
          >
            Suggested by Kez AI
          </span>
          <div className="font-bold text-[14px] leading-snug mt-[2px] text-ink">{nudge.title}</div>
          <div className="text-[12.5px] text-muted leading-[1.5] mt-1">{nudge.body}</div>
        </div>
      </div>

      {/* Actions */}
      {isDone ? (
        <div className="mt-[11px] ml-[47px] inline-flex items-center gap-[7px] bg-success-bg text-success px-3 py-[7px] rounded-[10px] text-[12px] font-semibold">
          <CheckIcon />
          {nudge.doneText}
        </div>
      ) : (
        <div className="flex gap-2 mt-3 pl-[47px]">
          <button
            onClick={onAct}
            className={cn(
              'h-[38px] px-4 rounded-[11px] text-[12.5px] font-bold text-white border-none cursor-pointer transition-opacity hover:opacity-90'
            )}
            style={{ background: nudge.accent }}
          >
            {nudge.primaryLabel}
          </button>
          <button
            onClick={onDismiss}
            className="h-[38px] px-[14px] rounded-[11px] text-[12.5px] font-semibold text-muted bg-transparent border border-line cursor-pointer hover:bg-surface-2 transition-colors"
          >
            Not now
          </button>
        </div>
      )}
    </div>
  )
}
