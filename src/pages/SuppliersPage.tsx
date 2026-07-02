import { useState } from 'react'
import { cedi } from '@/lib/braider'
import { cn } from '@/lib/utils'

interface Product { name: string; qty: string; amt: number }
interface Order   { date: string; total: number; items: number; status: 'paid' | 'outstanding' }

interface Supplier {
  name: string
  location: string
  contact: string
  spent: number
  orders: number
  lastOrder: string
  products: Product[]
  history: Order[]
}

const SUPPLIERS: Supplier[] = [
  {
    name: 'Royal Hair Supplies',
    location: 'Accra, GH',
    contact: '+233 20 900 1122',
    spent: 3840,
    orders: 11,
    lastOrder: 'Jul 17',
    products: [
      { name: 'Natural Black 18″',  qty: '6 packs × GH₵24',  amt: 144 },
      { name: 'Honey Blonde 20″',   qty: '4 packs × GH₵32',  amt: 128 },
      { name: 'Ombre Grey 22″',     qty: '5 packs × GH₵38',  amt: 190 },
      { name: 'Natural Black 20″',  qty: '10 packs × GH₵28', amt: 280 },
    ],
    history: [
      { date: 'Jul 17, 2026', total: 272,  items: 2, status: 'paid'        },
      { date: 'Jun 22, 2026', total: 190,  items: 1, status: 'paid'        },
      { date: 'Jun 10, 2026', total: 600,  items: 3, status: 'outstanding' },
      { date: 'May 28, 2026', total: 280,  items: 1, status: 'paid'        },
      { date: 'Apr 14, 2026', total: 420,  items: 4, status: 'paid'        },
    ],
  },
  {
    name: 'Akosombo Braids Co',
    location: 'Kumasi, GH',
    contact: '+233 24 445 6789',
    spent: 1260,
    orders: 4,
    lastOrder: 'Jun 30',
    products: [
      { name: 'Burgundy 24″',   qty: '3 packs × GH₵35',  amt: 105 },
      { name: 'Copper 20″',     qty: '5 packs × GH₵32',  amt: 160 },
      { name: 'Dark Brown 20″', qty: '4 packs × GH₵28',  amt: 112 },
    ],
    history: [
      { date: 'Jun 30, 2026', total: 265, items: 2, status: 'paid' },
      { date: 'Apr 20, 2026', total: 320, items: 3, status: 'paid' },
      { date: 'Feb 8, 2026',  total: 160, items: 1, status: 'paid' },
      { date: 'Jan 5, 2026',  total: 112, items: 1, status: 'paid' },
    ],
  },
  {
    name: 'Tema Extensions Hub',
    location: 'Tema, GH',
    contact: '+233 26 667 3344',
    spent: 580,
    orders: 2,
    lastOrder: 'Mar 12',
    products: [
      { name: 'Dark Brown 18″', qty: '5 packs × GH₵24', amt: 120 },
      { name: 'Natural Black 16″', qty: '8 packs × GH₵20', amt: 160 },
    ],
    history: [
      { date: 'Mar 12, 2026', total: 280, items: 2, status: 'paid' },
      { date: 'Jan 20, 2026', total: 300, items: 3, status: 'paid' },
    ],
  },
]

const TruckIcon = ({ color = 'white' }: { color?: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17h4V5H2v12h2M14 9h4l3 4v4h-3"/>
    <circle cx="7" cy="18" r="2"/>
    <circle cx="17" cy="18" r="2"/>
  </svg>
)

export function SuppliersPage() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [toast, setToast]             = useState<string | null>(null)
  const s = SUPPLIERS[selectedIdx]

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  return (
    <div className="flex h-full overflow-hidden relative" style={{ animation: 'bosUp 0.35s ease both' }}>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-[13px] font-semibold px-5 py-3 rounded-[14px] shadow-lg" style={{ animation: 'bosUp 0.25s ease both' }}>
          {toast}
        </div>
      )}

      {/* Left: supplier list */}
      <div className="flex flex-col border-r border-line bg-surface overflow-y-auto bos-scroll flex-none w-full lg:w-[320px]">
        <div className="p-5 pb-3">
          <h1 className="font-serif font-medium text-[24px] text-ink m-0 mb-[3px]">Suppliers</h1>
          <div className="text-[12px] text-muted font-semibold mb-4">{SUPPLIERS.length} partners</div>
        </div>

        <div className="flex flex-col gap-[9px] px-5 pb-5">
          {SUPPLIERS.map((sup, i) => (
            <button
              key={sup.name}
              onClick={() => setSelectedIdx(i)}
              className={cn(
                'flex items-center gap-3 bg-white border rounded-[16px] px-[14px] py-[13px] cursor-pointer text-left w-full shadow-[0_2px_10px_rgba(110,27,58,0.04)] transition-all',
                selectedIdx === i ? 'border-plum bg-plum-soft' : 'border-line hover:border-plum/30'
              )}
            >
              <div className={cn(
                'w-[44px] h-[44px] rounded-[14px] flex items-center justify-center flex-none',
                selectedIdx === i ? 'bg-plum' : 'bg-surface-2'
              )}>
                <TruckIcon color={selectedIdx === i ? 'white' : '#6E1B3A'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px] text-ink truncate">{sup.name}</div>
                <div className="text-[11.5px] text-muted mt-[2px]">{sup.location} · {sup.orders} orders</div>
              </div>
              <div className="text-right flex-none">
                <div className="font-bold text-[13.5px] font-serif text-ink">{cedi(sup.spent)}</div>
                <div className="text-[10px] text-muted">total spent</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: supplier detail */}
      <div className="flex-1 overflow-y-auto bos-scroll p-6 hidden lg:block">

        {/* Plum header card */}
        <div
          className="rounded-[20px] p-[20px] mb-5 text-white"
          style={{ background: 'linear-gradient(150deg,#6E1B3A,#8A2348)' }}
        >
          <div className="flex items-center gap-[13px] mb-5">
            <div className="w-[52px] h-[52px] rounded-[16px] bg-white/16 flex items-center justify-center flex-none">
              <TruckIcon />
            </div>
            <div>
              <div className="font-serif font-semibold text-[20px] leading-tight">{s.name}</div>
              <div className="text-[12px] opacity-85 mt-[3px]">{s.location} · {s.contact}</div>
            </div>
          </div>
          <div className="flex gap-[28px]">
            <div>
              <div className="text-[11px] opacity-75 font-semibold">Total spent</div>
              <div className="font-serif font-bold text-[22px] mt-[3px]">{cedi(s.spent)}</div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 font-semibold">Orders</div>
              <div className="font-serif font-bold text-[22px] mt-[3px]">{s.orders}</div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 font-semibold">Last order</div>
              <div className="font-serif font-bold text-[18px] mt-[5px]">{s.lastOrder}</div>
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Products bought */}
          <div className="bg-white border border-line rounded-[18px] p-5">
            <h2 className="text-[14px] font-bold text-ink m-0 mb-3">Products bought</h2>
            <div className="flex flex-col gap-[9px]">
              {s.products.map(p => (
                <div key={p.name} className="flex items-center justify-between bg-surface-2 rounded-[13px] px-[13px] py-[11px]">
                  <div>
                    <div className="font-bold text-[13.5px] text-ink">{p.name}</div>
                    <div className="text-[11.5px] text-muted mt-[2px]">{p.qty}</div>
                  </div>
                  <div className="font-bold text-[13.5px] font-serif text-ink">{cedi(p.amt)}</div>
                </div>
              ))}
            </div>
            <button
              className="mt-4 w-full bg-plum text-white border-none h-[48px] rounded-[14px] font-bold text-[13.5px] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => showToast(`Order placed with ${s.name} ✓`)}
            >
              Place new order
            </button>
          </div>

          {/* Order history */}
          <div className="bg-white border border-line rounded-[18px] p-5">
            <h2 className="text-[14px] font-bold text-ink m-0 mb-3">Order history</h2>
            <div className="flex flex-col gap-[9px]">
              {s.history.map((o, i) => (
                <div key={i} className="flex items-center gap-3 border border-line rounded-[13px] px-[13px] py-[11px]">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-ink">{o.date}</div>
                    <div className="text-[11px] text-muted mt-[1px]">{o.items} item{o.items !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-right flex-none">
                    <div className="font-bold text-[13px] text-ink font-serif">{cedi(o.total)}</div>
                    <span className={cn(
                      'text-[10.5px] font-bold px-[9px] py-[3px] rounded-[20px] mt-[3px] block',
                      o.status === 'paid' ? 'bg-success-bg text-success' : 'bg-draft-bg text-draft'
                    )}>
                      {o.status === 'paid' ? 'Paid' : 'Outstanding'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
