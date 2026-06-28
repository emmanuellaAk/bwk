import { useState } from 'react'
import { colorHex, cedi } from '@/lib/braider'
import { cn } from '@/lib/utils'
import type { Tab } from '@/components/layout/BottomNav'

interface StockItem {
  color: string
  length: string
  packs: number
  maxPacks: number
  pricePerPack: number
}

const STOCK: StockItem[] = [
  { color: 'Natural Black', length: '20″', packs: 24, maxPacks: 30, pricePerPack: 28 },
  { color: 'Natural Black', length: '18″', packs: 6,  maxPacks: 30, pricePerPack: 24 },
  { color: 'Natural Black', length: '16″', packs: 8,  maxPacks: 30, pricePerPack: 20 },
  { color: 'Dark Brown',    length: '20″', packs: 1,  maxPacks: 20, pricePerPack: 28 },
  { color: 'Dark Brown',    length: '18″', packs: 3,  maxPacks: 20, pricePerPack: 24 },
  { color: 'Burgundy',      length: '24″', packs: 1,  maxPacks: 18, pricePerPack: 35 },
  { color: 'Honey Blonde',  length: '20″', packs: 8,  maxPacks: 20, pricePerPack: 32 },
  { color: 'Honey Blonde',  length: '18″', packs: 4,  maxPacks: 20, pricePerPack: 28 },
  { color: 'Ombre Grey',    length: '22″', packs: 2,  maxPacks: 15, pricePerPack: 38 },
  { color: 'Copper',        length: '20″', packs: 5,  maxPacks: 15, pricePerPack: 32 },
]

function stockStatus(packs: number): 'low' | 'ok' | 'good' {
  if (packs <= 2) return 'low'
  if (packs <= 6) return 'ok'
  return 'good'
}

const STATUS_STYLE = {
  low:  { text: 'Low stock', bg: 'bg-draft-bg',    color: 'text-draft'   },
  ok:   { text: 'OK',        bg: 'bg-surface-2',   color: 'text-muted'   },
  good: { text: 'In stock',  bg: 'bg-success-bg',  color: 'text-success' },
}

const BAR_COLOR = {
  low:  '#B5762A',
  ok:   '#8A7B80',
  good: '#2F7D5B',
}

const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)

interface Props {
  onNavigate: (tab: Tab) => void
}

export function InventoryPage({ onNavigate }: Props) {
  const [search, setSearch] = useState('')

  const totalPacks = STOCK.reduce((s, i) => s + i.packs, 0)
  const stockValue = STOCK.reduce((s, i) => s + i.packs * i.pricePerPack, 0)
  const lowItems   = STOCK.filter(i => stockStatus(i.packs) === 'low')

  const filtered = STOCK.filter(i =>
    `${i.color} ${i.length}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 h-full overflow-y-auto bos-scroll" style={{ animation: 'bosUp 0.35s ease both' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif font-medium text-[28px] leading-tight text-ink m-0">Inventory</h1>
          <div className="text-[12px] text-muted font-semibold mt-1">{STOCK.length} extensions tracked</div>
        </div>
        <button
          onClick={() => onNavigate('suppliers')}
          className="flex items-center gap-[6px] text-plum text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 hover:opacity-75 transition-opacity"
        >
          Suppliers <ArrowRight />
        </button>
      </div>

      {/* Row 1: 3 stat cards */}
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <div className="bg-white border border-line rounded-[16px] p-[14px]">
          <div className="text-[10.5px] text-muted font-semibold">Total packs</div>
          <div className="font-serif font-bold text-[22px] text-ink mt-1">{totalPacks}</div>
          <div className="text-[11px] text-muted font-semibold mt-[5px]">{STOCK.length} skus</div>
        </div>
        <div className="bg-plum text-white rounded-[16px] p-[14px]">
          <div className="text-[10.5px] opacity-75 font-semibold">Stock value</div>
          <div className="font-serif font-bold text-[22px] mt-1">{cedi(stockValue)}</div>
          <div className="text-[11px] opacity-70 font-semibold mt-[5px]">at cost price</div>
        </div>
        <div className="bg-draft-bg border border-[rgba(181,118,42,0.22)] rounded-[16px] p-[14px]">
          <div className="text-[10.5px] text-draft font-semibold">Low stock</div>
          <div className="font-serif font-bold text-[22px] text-draft mt-1">{lowItems.length}</div>
          <div className="text-[11px] text-draft/70 font-semibold mt-[5px]">need reorder</div>
        </div>
      </div>

      {/* Row 2: stock list (left) + sidebar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* Left: extensions list */}
        <div className="bg-white border border-line rounded-[18px] p-5">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-bold text-[15px] text-ink m-0 flex-1">Extensions</h2>
            <div className="flex items-center gap-2 bg-surface-2 border border-line rounded-[12px] px-[12px] py-[8px] flex-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted flex-none">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="border-none outline-none bg-transparent text-[12.5px] text-ink placeholder:text-muted w-[100px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[9px]">
            {filtered.map((it, i) => {
              const hex    = colorHex(it.color)
              const status = stockStatus(it.packs)
              const st     = STATUS_STYLE[status]
              const pct    = Math.round((it.packs / it.maxPacks) * 100)
              return (
                <div key={i} className="flex items-center gap-3 border border-line rounded-[14px] px-[14px] py-[13px] shadow-[0_1px_6px_rgba(110,27,58,0.04)]">
                  <span
                    className="w-[34px] h-[34px] rounded-[10px] border border-black/10 flex-none"
                    style={{ background: hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-[7px]">
                      <div className="font-bold text-[13.5px] text-ink">{it.color} · {it.length}</div>
                      <span className={cn('text-[11px] font-bold px-[10px] py-[4px] rounded-[20px]', st.bg, st.color)}>
                        {st.text}
                      </span>
                    </div>
                    <div className="h-[6px] bg-surface-2 rounded-[4px] overflow-hidden">
                      <div
                        className="h-full rounded-[4px] transition-all"
                        style={{ width: `${pct}%`, background: BAR_COLOR[status] }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-[5px]">
                      <div className="text-[10.5px] text-muted font-semibold">{it.packs} of {it.maxPacks} packs</div>
                      <div className="text-[10.5px] text-muted font-semibold">{cedi(it.pricePerPack)}/pack</div>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted text-[13px]">No items match</div>
            )}
          </div>

          <button className="mt-4 w-full flex items-center justify-center gap-2 bg-plum-soft text-plum border border-dashed border-plum/25 h-[48px] rounded-[14px] font-bold text-[13.5px] cursor-pointer hover:opacity-85 transition-opacity">
            <PlusIcon /> Add stock / log purchase
          </button>
        </div>

        {/* Right: low stock + recent purchases */}
        <div className="flex flex-col gap-4">

          {/* Low stock reorder queue */}
          <div className="bg-white border border-line rounded-[18px] p-5">
            <h3 className="font-bold text-[14px] text-ink m-0 mb-3">Reorder queue</h3>
            {lowItems.length === 0 ? (
              <div className="text-center py-4 text-muted text-[12.5px]">All stocked up ✓</div>
            ) : (
              <div className="flex flex-col gap-[9px]">
                {lowItems.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 bg-draft-bg rounded-[13px] px-[13px] py-[11px]">
                    <span
                      className="w-[10px] h-[10px] rounded-full border border-black/10 flex-none"
                      style={{ background: colorHex(it.color) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] text-ink truncate">{it.color} · {it.length}</div>
                      <div className="text-[11px] text-draft font-semibold mt-[1px]">{it.packs} pack{it.packs !== 1 ? 's' : ''} left</div>
                    </div>
                    <button className="bg-plum text-white border-none h-[32px] px-[12px] rounded-[9px] text-[11.5px] font-bold cursor-pointer flex-none hover:opacity-90 transition-opacity">
                      Reorder
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent purchases */}
          <div className="bg-white border border-line rounded-[18px] p-5">
            <h3 className="font-bold text-[14px] text-ink m-0 mb-3">Recent purchases</h3>
            <div className="flex flex-col gap-[10px]">
              {[
                { label: 'Natural Black 18″ × 6', supplier: 'Royal Hair Supplies', amt: 144, date: 'Jul 17' },
                { label: 'Honey Blonde 20″ × 4',  supplier: 'Royal Hair Supplies', amt: 128, date: 'Jul 14' },
                { label: 'Burgundy 24″ × 3',       supplier: 'Akosombo Braids Co', amt: 105, date: 'Jun 30' },
                { label: 'Ombre Grey 22″ × 5',     supplier: 'Royal Hair Supplies', amt: 190, date: 'Jun 22' },
              ].map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-[8px] h-[8px] rounded-full bg-muted/40 flex-none mt-[5px]" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[12.5px] text-ink leading-tight">{p.label}</div>
                    <div className="text-[11px] text-muted mt-[1px]">{p.supplier} · {p.date}</div>
                  </div>
                  <div className="font-bold text-[12.5px] text-ink flex-none">{cedi(p.amt)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Go to suppliers CTA */}
          <button
            onClick={() => onNavigate('suppliers')}
            className="w-full bg-plum text-white border-none h-[48px] rounded-[14px] font-bold text-[13.5px] cursor-pointer hover:opacity-90 transition-opacity"
          >
            View suppliers
          </button>
        </div>
      </div>
    </div>
  )
}
