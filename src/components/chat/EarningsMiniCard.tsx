interface Props {
  delta:     string
  revenue:   string
  expenses:  string
  completed: number
  profit:    string
}

export function EarningsMiniCard({ delta, revenue, expenses, completed, profit }: Props) {
  return (
    <div
      className="self-start w-[min(330px,90%)] ml-[37px] bg-white border border-line rounded-[5px_20px_20px_20px] p-[15px_16px] shadow-[0_3px_14px_rgba(110,27,58,0.07)]"
      style={{ animation: 'bosUp 0.4s ease both' }}
    >
      <div className="flex items-center justify-between mb-[13px]">
        <div className="font-bold text-[14px] text-ink">This week</div>
        <span className="text-[11px] text-success font-bold bg-success-bg px-[9px] py-[3px] rounded-[20px]">▲ {delta}</span>
      </div>
      <div className="grid grid-cols-2 gap-[9px]">
        <div className="bg-plum-soft rounded-[13px] p-[11px_13px]">
          <div className="text-[10.5px] text-muted font-semibold">Revenue</div>
          <div className="font-serif font-bold text-[18px] text-ink mt-[3px]">{revenue}</div>
        </div>
        <div className="bg-surface-2 rounded-[13px] p-[11px_13px]">
          <div className="text-[10.5px] text-muted font-semibold">Expenses</div>
          <div className="font-serif font-bold text-[18px] text-ink mt-[3px]">{expenses}</div>
        </div>
        <div className="bg-surface-2 rounded-[13px] p-[11px_13px]">
          <div className="text-[10.5px] text-muted font-semibold">Completed</div>
          <div className="font-serif font-bold text-[18px] text-ink mt-[3px]">{completed}</div>
        </div>
        <div className="bg-plum rounded-[13px] p-[11px_13px] text-white">
          <div className="text-[10.5px] opacity-80 font-semibold">Net profit</div>
          <div className="font-serif font-bold text-[18px] mt-[3px]">{profit}</div>
        </div>
      </div>
    </div>
  )
}
