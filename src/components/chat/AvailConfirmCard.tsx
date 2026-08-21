const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

interface Props { title: string; body: string }

export function AvailConfirmCard({ title, body }: Props) {
  return (
    <div
      className="self-start w-[min(360px,90%)] ml-[37px] flex items-center gap-[11px] bg-white border border-success/20 rounded-[6px_18px_18px_18px] p-[14px_15px] shadow-[0_1px_10px_rgba(34,27,30,0.05)]"
      style={{ animation: 'bosUp 0.4s ease both' }}
    >
      <span className="w-[34px] h-[34px] rounded-[11px] bg-success-bg text-success flex items-center justify-center flex-none">
        <CheckIcon />
      </span>
      <div>
        <div className="font-bold text-[13.5px] text-ink">{title}</div>
        <div className="text-[12.5px] text-muted mt-[3px] leading-relaxed">{body}</div>
      </div>
    </div>
  )
}
