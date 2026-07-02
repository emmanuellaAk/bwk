const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

interface Props { title: string; body: string }

export function AvailConfirmCard({ title, body }: Props) {
  return (
    <div
      className="self-start w-[min(330px,90%)] ml-[37px] flex items-center gap-[11px] bg-success-bg border border-success/20 rounded-[5px_18px_18px_18px] p-[13px_15px]"
      style={{ animation: 'bosUp 0.4s ease both' }}
    >
      <span className="w-[34px] h-[34px] rounded-[11px] bg-success text-white flex items-center justify-center flex-none">
        <CheckIcon />
      </span>
      <div>
        <div className="font-bold text-[13.5px] text-success">{title}</div>
        <div className="text-[12.5px] text-ink mt-[2px]">{body}</div>
      </div>
    </div>
  )
}
