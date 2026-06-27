import { useState } from 'react'
import { cedi } from '@/lib/braider'
import { cn } from '@/lib/utils'

type Period = 'week' | 'month' | 'year'

const STATS: Record<Period, { revenue: number; expenses: number; profit: number }> = {
  week:  { revenue: 2840,  expenses: 420,  profit: 2420  },
  month: { revenue: 9450,  expenses: 1620, profit: 7830  },
  year:  { revenue: 98400, expenses: 14200, profit: 84200 },
}

const BARS_RAW = [
  { m: 'Feb', v: 6200  },
  { m: 'Mar', v: 7400  },
  { m: 'Apr', v: 8100  },
  { m: 'May', v: 7600  },
  { m: 'Jun', v: 8900  },
  { m: 'Jul', v: 9450  },
]
const MAX_BAR = Math.max(...BARS_RAW.map(b => b.v))
const BARS = BARS_RAW.map(b => ({
  ...b,
  h: Math.round((b.v / MAX_BAR) * 100),
  label: `GH₵${(b.v / 1000).toFixed(1)}k`,
  isLast: b.m === 'Jul',
}))

const TOP_STYLES_RAW = [
  { name: 'Knotless Braids',  bookings: 24, rev: 7800 },
  { name: 'Boho Braids',      bookings: 16, rev: 6720 },
  { name: 'Goddess Braids',   bookings: 9,  rev: 4050 },
  { name: 'Cornrows',         bookings: 21, rev: 3360 },
]
const MAX_REV = Math.max(...TOP_STYLES_RAW.map(s => s.rev))
const TOP_STYLES = TOP_STYLES_RAW.map(s => ({
  ...s,
  pct: Math.round((s.rev / MAX_REV) * 100),
  revStr: cedi(s.rev),
}))

export function FinancePage() {
  const [period, setPeriod] = useState<Period>('month')
  const stats = STATS[period]

  return (
    <div className="p-6 h-full overflow-y-auto bos-scroll" style={{ animation: 'bosUp 0.35s ease both' }}>

      {/* Title + toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif font-medium text-[28px] leading-tight text-ink m-0">Finance</h1>
          <div className="text-[12px] text-muted font-semibold mt-1">July 2026</div>
        </div>
        <div className="flex bg-surface-2 p-[3px] rounded-[13px] border border-line gap-[3px]">
          {(['week', 'month', 'year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-[18px] py-[8px] rounded-[10px] text-[13px] border-none cursor-pointer capitalize transition-all',
                period === p ? 'font-bold bg-white text-ink shadow-sm' : 'font-semibold bg-transparent text-muted'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: 3 stat cards */}
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <div className="bg-white border border-line rounded-[16px] p-[14px]">
          <div className="text-[10.5px] text-muted font-semibold">Revenue</div>
          <div className="font-serif font-bold text-[20px] text-ink mt-1">{cedi(stats.revenue)}</div>
          <div className="text-[11px] text-success font-semibold mt-[6px]">▲ 6.2% vs last month</div>
        </div>
        <div className="bg-white border border-line rounded-[16px] p-[14px]">
          <div className="text-[10.5px] text-muted font-semibold">Expenses</div>
          <div className="font-serif font-bold text-[20px] text-draft mt-1">{cedi(stats.expenses)}</div>
          <div className="text-[11px] text-muted font-semibold mt-[6px]">Supplies & overheads</div>
        </div>
        <div className="bg-plum text-white rounded-[16px] p-[14px]">
          <div className="text-[10.5px] opacity-75 font-semibold">Profit</div>
          <div className="font-serif font-bold text-[20px] mt-1">{cedi(stats.profit)}</div>
          <div className="text-[11px] opacity-75 font-semibold mt-[6px]">GH₵385 avg / appt</div>
        </div>
      </div>

      {/* Row 2: Bar chart (left) | Top hairstyles (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-6">

        <div className="bg-white border border-line rounded-[18px] p-[16px_16px_12px]">
          <div className="text-[13px] font-bold text-ink mb-[14px]">Revenue · last 6 months</div>
          <div className="flex items-end justify-between gap-[9px]" style={{ height: 140 }}>
            {BARS.map(b => (
              <div key={b.m} className="flex-1 flex flex-col items-center gap-[7px] h-full justify-end">
                <div className="text-[9px] font-bold text-muted">{b.label}</div>
                <div
                  className="w-full max-w-[36px] rounded-t-[7px] relative overflow-hidden"
                  style={{ height: `${b.h}%`, background: '#F6E7EC', transformOrigin: 'bottom', animation: 'bosBar 0.6s ease both' }}
                >
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#6E1B3A,#8A2348)', opacity: b.h / 100 }} />
                  {b.isLast && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#6E1B3A,#8A2348)' }} />}
                </div>
                <div className={cn('text-[10.5px] font-semibold', b.isLast ? 'text-plum font-bold' : 'text-ink')}>{b.m}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-line rounded-[18px] p-5">
          <h2 className="text-[15px] font-bold text-ink m-0 mb-[14px]">Top hairstyles</h2>
          <div className="flex flex-col gap-[14px]">
            {TOP_STYLES.map(s => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-[6px]">
                  <div className="font-bold text-[13px] text-ink">{s.name}</div>
                  <div className="text-[11.5px] text-muted font-semibold">{s.bookings} · {s.revStr}</div>
                </div>
                <div className="h-[8px] bg-surface-2 rounded-[5px] overflow-hidden">
                  <div className="h-full rounded-[5px]" style={{ width: `${s.pct}%`, background: 'linear-gradient(90deg,#6E1B3A,#8A2348)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Recent activity (left) | Outstanding + top client (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white border border-line rounded-[18px] p-5">
          <h2 className="text-[14px] font-bold text-ink m-0 mb-3">Recent activity</h2>
          <div className="flex flex-col gap-[10px]">
            {[
              { label: 'Esi Owusu',          detail: 'Boho Braids · full payment',   amt: 420,  income: true,  date: 'Jul 18' },
              { label: 'Royal Hair Supplies', detail: 'Natural Black 18″ × 6 packs', amt: 270,  income: false, date: 'Jul 17' },
              { label: 'Akua Darko',          detail: 'Cornrows · full payment',      amt: 180,  income: true,  date: 'Jul 16' },
              { label: 'Ama Mensah',          detail: 'Knotless Braids · deposit',    amt: 350,  income: true,  date: 'Jul 15' },
              { label: 'Maame Osei',          detail: 'Knotless Braids · deposit',    amt: 150,  income: true,  date: 'Jul 14' },
              { label: 'Royal Hair Supplies', detail: 'Honey Blonde 20″ × 4 packs',  amt: 200,  income: false, date: 'Jul 14' },
              { label: 'Abena Sarpong',       detail: 'Knotless Braids · balance',    amt: 250,  income: true,  date: 'Jul 6'  },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn('w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-none text-[13px]', t.income ? 'bg-success-bg' : 'bg-draft-bg')}>
                  {t.income ? '↓' : '↑'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] text-ink leading-tight truncate">{t.label}</div>
                  <div className="text-[11px] text-muted mt-[1px]">{t.detail} · {t.date}</div>
                </div>
                <div className={cn('font-bold text-[13px] flex-none', t.income ? 'text-success' : 'text-draft')}>
                  {t.income ? '+' : '−'}{cedi(t.amt)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">

          {/* Outstanding */}
          <div className="bg-white border border-line rounded-[18px] p-5 flex-1">
            <h2 className="text-[14px] font-bold text-ink m-0 mb-3">Outstanding</h2>
            <div className="flex flex-col gap-[9px]">
              {[
                { name: 'Ama Mensah',          detail: 'Knotless Braids',          due: 260, type: 'client'   },
                { name: 'Abena Sarpong',        detail: 'Fulani Braids',            due: 250, type: 'client'   },
                { name: 'Royal Hair Supplies',  detail: 'Invoice #0041 · Jul 10',   due: 600, type: 'supplier' },
              ].map(o => (
                <div key={o.name} className="flex items-center gap-3 bg-surface-2 rounded-[12px] px-[13px] py-[11px]">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-ink truncate">{o.name}</div>
                    <div className="text-[11px] text-muted mt-[1px]">{o.detail} · <span className="capitalize">{o.type}</span></div>
                  </div>
                  <span className="text-[11.5px] font-bold text-draft bg-draft-bg px-[10px] py-[4px] rounded-[20px] flex-none">
                    {cedi(o.due)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-muted">Total outstanding</span>
              <span className="font-serif font-bold text-[15px] text-draft">{cedi(1110)}</span>
            </div>
          </div>

          {/* Top client highlight */}
          <div className="bg-plum-soft rounded-[16px] p-[15px] flex items-center gap-[13px]">
            <span className="w-[42px] h-[42px] rounded-[13px] bg-plum text-white flex items-center justify-center flex-none font-serif font-bold text-[13px]">
              AS
            </span>
            <div>
              <div className="font-bold text-[13px] text-ink">Abena is your top client</div>
              <div className="text-[12px] text-muted mt-[2px]">GH₵1,480 · 6 visits · 17% of revenue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
