import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

const CHIPS = [
  { label: "Today's appointments", icon: '📅' },
  { label: 'Check earnings',       icon: '💰' },
  { label: 'Add booking',          icon: '➕' },
  { label: 'Check inventory',      icon: '📦' },
  { label: 'View customers',       icon: '👥' },
]

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

export function Composer({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 110) + 'px'
  }, [value])

  const send = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const chipSend = (label: string) => {
    if (disabled) return
    onSend(label)
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="flex-none bg-surface border-t border-line px-[14px] pt-[9px] pb-3">
      {/* Quick action chips */}
      <div className="bos-scroll flex gap-[7px] overflow-x-auto pb-[9px] -mx-[2px] px-[2px]">
        {CHIPS.map(chip => (
          <button
            key={chip.label}
            onClick={() => chipSend(chip.label)}
            disabled={disabled}
            className="flex-none flex items-center gap-[6px] bg-plum-soft text-plum border-none h-[34px] px-[13px] rounded-[18px] text-[12px] font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <span>{chip.icon}</span>
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2 bg-surface-2 border border-line rounded-[22px] p-[6px_6px_6px_8px]">
        {/* Camera */}
        <button className="flex-none w-[38px] h-[38px] rounded-full border-none bg-transparent text-muted cursor-pointer flex items-center justify-center hover:bg-line/50 transition-colors">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3z"/>
            <circle cx="12" cy="13" r="3.5"/>
          </svg>
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Paste or forward a customer's message…"
          disabled={disabled}
          className={cn(
            'flex-1 border-none bg-transparent resize-none outline-none text-[14px] font-medium text-ink leading-[1.4]',
            'placeholder:text-muted min-h-[38px] max-h-[110px] py-[9px] px-[2px] disabled:opacity-60'
          )}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        />

        {/* Mic */}
        <button className="flex-none w-[38px] h-[38px] rounded-full border-none bg-transparent text-muted cursor-pointer flex items-center justify-center hover:bg-line/50 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3"/>
            <path d="M5 10a7 7 0 0 0 14 0M12 19v3"/>
          </svg>
        </button>

        {/* Send */}
        <button
          onClick={send}
          disabled={!canSend}
          className={cn(
            'flex-none w-[40px] h-[40px] rounded-full border-none cursor-pointer flex items-center justify-center transition-colors',
            canSend ? 'bg-plum text-white' : 'bg-line text-muted cursor-default'
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>
          </svg>
        </button>
      </div>

      {/* Hint */}
      <div className="text-center text-[10.5px] text-muted mt-[7px] flex items-center justify-center gap-[6px]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#6E1B3A">
          <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/>
        </svg>
        Paste a message and I'll turn it into a booking automatically
      </div>
    </div>
  )
}
