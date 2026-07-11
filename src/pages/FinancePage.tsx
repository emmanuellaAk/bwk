import { useState } from 'react'
import { cedi } from '@/lib/braider'
import { cn } from '@/lib/utils'
import { tokenStore } from '@/lib/api/token'
import {
  useFinanceSummary,
  useMonthlyRevenue,
  useTopServices,
  useTransactions,
  useOutstanding,
} from '@/lib/api/hooks/useFinance'
import type { Period } from '@/lib/api/hooks/useFinance'

// ── Demo data (shown when not connected to backend) ───────────────────────────

const DEMO_STATS: Record<Period, { revenue: number; expenses: number; profit: number }> = {
  week:  { revenue: 2840,  expenses: 420,   profit: 2420  },
  month: { revenue: 9450,  expenses: 1620,  profit: 7830  },
  year:  { revenue: 98400, expenses: 14200, profit: 84200 },
}

const DEMO_BARS = [
  { month: 'Feb', revenue: 6200 },
  { month: 'Mar', revenue: 7400 },
  { month: 'Apr', revenue: 8100 },
  { month: 'May', revenue: 7600 },
  { month: 'Jun', revenue: 8900 },
  { month: 'Jul', revenue: 9450 },
]

const DEMO_TOP_SERVICES = [
  { service_name: 'Knotless Braids', bookings: 24, revenue: 7800 },
  { service_name: 'Boho Braids',     bookings: 16, revenue: 6720 },
  { service_name: 'Goddess Braids',  bookings: 9,  revenue: 4050 },
  { service_name: 'Cornrows',        bookings: 21, revenue: 3360 },
]

const DEMO_TRANSACTIONS = [
  { id: '1', kind: 'income'  as const, amount: 420, description: 'Esi Owusu · Boho Braids · full payment',         occurred_at: '2026-07-18T10:00:00Z', appointment_id: null, created_at: '' },
  { id: '2', kind: 'expense' as const, amount: 270, description: 'Royal Hair Supplies · Natural Black 18″ × 6',    occurred_at: '2026-07-17T14:00:00Z', appointment_id: null, created_at: '' },
  { id: '3', kind: 'income'  as const, amount: 180, description: 'Akua Darko · Cornrows · full payment',            occurred_at: '2026-07-16T09:00:00Z', appointment_id: null, created_at: '' },
  { id: '4', kind: 'income'  as const, amount: 350, description: 'Ama Mensah · Knotless Braids · deposit',          occurred_at: '2026-07-15T11:00:00Z', appointment_id: null, created_at: '' },
  { id: '5', kind: 'income'  as const, amount: 150, description: 'Maame Osei · Knotless Braids · deposit',          occurred_at: '2026-07-14T09:30:00Z', appointment_id: null, created_at: '' },
  { id: '6', kind: 'expense' as const, amount: 200, description: 'Royal Hair Supplies · Honey Blonde 20″ × 4',      occurred_at: '2026-07-14T08:00:00Z', appointment_id: null, created_at: '' },
  { id: '7', kind: 'income'  as const, amount: 250, description: 'Abena Sarpong · Knotless Braids · balance',       occurred_at: '2026-07-06T15:00:00Z', appointment_id: null, created_at: '' },
]

const DEMO_OUTSTANDING = [
  { appointment_id: 'a1', client_name: 'Ama Mensah',         service_name: 'Knotless Braids', total_price: 380, deposit_paid: 120, balance_due: 260, starts_at: '' },
  { appointment_id: 'a2', client_name: 'Abena Sarpong',      service_name: 'Fulani Braids',   total_price: 350, deposit_paid: 100, balance_due: 250, starts_at: '' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(isoStr: string): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildBars(points: { month: string; revenue: number }[]) {
  const max = Math.max(...points.map(p => p.revenue), 1)
  return points.map((p, i) => ({
    ...p,
    h: Math.round((p.revenue / max) * 100),
    label: `GH₵${(p.revenue / 1000).toFixed(1)}k`,
    isLast: i === points.length - 1,
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FinancePage() {
  const [period, setPeriod] = useState<Period>('month')
  const hasToken = !!tokenStore.get()

  const { data: summaryData } = useFinanceSummary(period)
  const { data: monthlyData }  = useMonthlyRevenue(6)
  const { data: servicesData } = useTopServices(5)
  const { data: txnsData }     = useTransactions(20)
  const { data: outstandingData } = useOutstanding()

  const stats = summaryData ?? DEMO_STATS[period]
  const barPoints  = monthlyData?.length  ? monthlyData  : DEMO_BARS
  const topSvcs    = servicesData?.length ? servicesData : DEMO_TOP_SERVICES
  const txns       = txnsData             ?? DEMO_TRANSACTIONS
  const outstanding = outstandingData     ?? DEMO_OUTSTANDING

  const bars = buildBars(barPoints)
  const maxRev = Math.max(...topSvcs.map(s => s.revenue), 1)
  const totalOutstanding = outstanding.reduce((s, o) => s + o.balance_due, 0)

  return (
    <div className="p-6 h-full overflow-y-auto bos-scroll" style={{ animation: 'bosUp 0.35s ease both' }}>

      {/* Title + toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif font-medium text-[28px] leading-tight text-ink m-0">Finance</h1>
          <div className="text-[12px] text-muted font-semibold mt-1">
            {!hasToken && <span className="text-draft">Demo data · </span>}
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
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
          <div className="text-[11px] text-success font-semibold mt-[6px]">From confirmed appointments</div>
        </div>
        <div className="bg-white border border-line rounded-[16px] p-[14px]">
          <div className="text-[10.5px] text-muted font-semibold">Expenses</div>
          <div className="font-serif font-bold text-[20px] text-draft mt-1">{cedi(stats.expenses)}</div>
          <div className="text-[11px] text-muted font-semibold mt-[6px]">Supplies & overheads</div>
        </div>
        <div className="bg-plum text-white rounded-[16px] p-[14px]">
          <div className="text-[10.5px] opacity-75 font-semibold">Profit</div>
          <div className="font-serif font-bold text-[20px] mt-1">{cedi(stats.profit)}</div>
          <div className="text-[11px] opacity-75 font-semibold mt-[6px]">
            {stats.revenue > 0
              ? `${Math.round((stats.profit / stats.revenue) * 100)}% margin`
              : 'No revenue yet'}
          </div>
        </div>
      </div>

      {/* Row 2: Bar chart + Top services */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-6">

        <div className="bg-white border border-line rounded-[18px] p-[16px_16px_12px]">
          <div className="text-[13px] font-bold text-ink mb-[14px]">Revenue · last 6 months</div>
          {bars.length === 0 ? (
            <div className="flex items-center justify-center h-[140px] text-[12px] text-muted">No data yet</div>
          ) : (
            <div className="flex items-end justify-between gap-[9px]" style={{ height: 140 }}>
              {bars.map(b => (
                <div key={b.month} className="flex-1 flex flex-col items-center gap-[7px] h-full justify-end">
                  <div className="text-[9px] font-bold text-muted">{b.label}</div>
                  <div
                    className="w-full max-w-[36px] rounded-t-[7px] relative overflow-hidden"
                    style={{ height: `${b.h}%`, background: '#F6E7EC', transformOrigin: 'bottom', animation: 'bosBar 0.6s ease both' }}
                  >
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#6E1B3A,#8A2348)', opacity: b.h / 100 }} />
                    {b.isLast && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#6E1B3A,#8A2348)' }} />}
                  </div>
                  <div className={cn('text-[10.5px] font-semibold', b.isLast ? 'text-plum font-bold' : 'text-ink')}>{b.month}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-line rounded-[18px] p-5">
          <h2 className="text-[15px] font-bold text-ink m-0 mb-[14px]">Top services</h2>
          {topSvcs.length === 0 ? (
            <div className="text-[12px] text-muted py-4 text-center">No confirmed appointments yet</div>
          ) : (
            <div className="flex flex-col gap-[14px]">
              {topSvcs.map(s => (
                <div key={s.service_name}>
                  <div className="flex items-center justify-between mb-[6px]">
                    <div className="font-bold text-[13px] text-ink">{s.service_name}</div>
                    <div className="text-[11.5px] text-muted font-semibold">{s.bookings} · {cedi(s.revenue)}</div>
                  </div>
                  <div className="h-[8px] bg-surface-2 rounded-[5px] overflow-hidden">
                    <div
                      className="h-full rounded-[5px]"
                      style={{ width: `${Math.round((s.revenue / maxRev) * 100)}%`, background: 'linear-gradient(90deg,#6E1B3A,#8A2348)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Recent activity + Outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white border border-line rounded-[18px] p-5">
          <h2 className="text-[14px] font-bold text-ink m-0 mb-3">Recent activity</h2>
          {txns.length === 0 ? (
            <div className="text-[12px] text-muted py-4 text-center">No transactions logged yet</div>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {txns.map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className={cn(
                    'w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-none text-[13px]',
                    t.kind === 'income' ? 'bg-success-bg' : 'bg-draft-bg'
                  )}>
                    {t.kind === 'income' ? '↓' : '↑'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-ink leading-tight truncate">{t.description}</div>
                    <div className="text-[11px] text-muted mt-[1px]">{fmtDate(t.occurred_at)}</div>
                  </div>
                  <div className={cn('font-bold text-[13px] flex-none', t.kind === 'income' ? 'text-success' : 'text-draft')}>
                    {t.kind === 'income' ? '+' : '−'}{cedi(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">

          <div className="bg-white border border-line rounded-[18px] p-5 flex-1">
            <h2 className="text-[14px] font-bold text-ink m-0 mb-3">Outstanding</h2>
            {outstanding.length === 0 ? (
              <div className="text-[12px] text-muted py-4 text-center">All balances paid ✓</div>
            ) : (
              <div className="flex flex-col gap-[9px]">
                {outstanding.map(o => (
                  <div key={o.appointment_id} className="flex items-center gap-3 bg-surface-2 rounded-[12px] px-[13px] py-[11px]">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] text-ink truncate">{o.client_name ?? 'Client'}</div>
                      <div className="text-[11px] text-muted mt-[1px]">{o.service_name ?? ''}</div>
                    </div>
                    <span className="text-[11.5px] font-bold text-draft bg-draft-bg px-[10px] py-[4px] rounded-[20px] flex-none">
                      {cedi(o.balance_due)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {outstanding.length > 0 && (
              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-muted">Total outstanding</span>
                <span className="font-serif font-bold text-[15px] text-draft">{cedi(totalOutstanding)}</span>
              </div>
            )}
          </div>

          {outstanding.length > 0 && (
            <div className="bg-plum-soft rounded-[16px] p-[15px]">
              <div className="font-bold text-[13px] text-ink">
                {outstanding.length} unpaid balance{outstanding.length !== 1 ? 's' : ''}
              </div>
              <div className="text-[12px] text-muted mt-[2px]">
                {cedi(totalOutstanding)} total · send reminders via Chat
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
