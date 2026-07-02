import {
  MessageCircle, LayoutDashboard, Calendar, Users,
  Package, Truck, BarChart2, ExternalLink,
} from 'lucide-react'
import { BottomNav, type Tab } from './BottomNav'
import { cn } from '@/lib/utils'

const SIDEBAR_NAV = [
  { id: 'chat' as Tab,     label: 'Chat',      Icon: MessageCircle,  badge: null },
  { id: 'home' as Tab,     label: 'Dashboard', Icon: LayoutDashboard, badge: null },
  { id: 'calendar' as Tab, label: 'Calendar',  Icon: Calendar,       badge: '3' },
  { id: 'clients' as Tab,  label: 'Clients',   Icon: Users,          badge: null },
  { id: 'inventory' as Tab,label: 'Inventory', Icon: Package,        badge: '3' },
  { id: 'suppliers' as Tab,label: 'Suppliers', Icon: Truck,          badge: null },
  { id: 'finance' as Tab,  label: 'Finance',   Icon: BarChart2,      badge: null },
]

const HEADER: Record<string, { title: string; sub: string }> = {
  chat:      { title: 'Kez AI',     sub: 'Your AI assistant · online' },
  home:      { title: 'Dashboard',  sub: "Today's overview" },
  calendar:  { title: 'Calendar',   sub: 'July 2026' },
  clients:   { title: 'Customers',  sub: '48 total' },
  inventory: { title: 'Inventory',  sub: '10 items · 3 low' },
  suppliers: { title: 'Suppliers',  sub: '3 partners' },
  finance:   { title: 'Finance',    sub: 'This month' },
}

/* ── right context panel data (chat only) ── */
const TODAY_APPTS = [
  { name: 'Ama Mensah',  initials: 'AM', color: '#6E1B3A', time: '9:00',  ampm: 'AM', style: 'Knotless Braids' },
  { name: 'Esi Boateng', initials: 'EB', color: '#2F7D5B', time: '11:30', ampm: 'AM', style: 'Boho Braids' },
  { name: 'Abena Sarpong',initials: 'AS',color: '#B5762A', time: '2:00',  ampm: 'PM', style: 'Fulani Braids' },
]

interface AppShellProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onOpenPortal: () => void
  children: React.ReactNode
}

export function AppShell({ activeTab, onTabChange, onOpenPortal, children }: AppShellProps) {
  const { title, sub } = HEADER[activeTab] ?? HEADER.chat
  const isChat = activeTab === 'chat'

  return (
    <div className="flex min-h-dvh bg-surface">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-[248px] flex-none border-r border-line bg-surface px-4 py-5">
        {/* Brand */}
        <div className="flex items-center gap-[11px] px-2 pb-5">
          <div className="w-[42px] h-[42px] rounded-full bg-plum flex items-center justify-center shadow-[0_2px_8px_rgba(110,27,58,0.14)] flex-none">
            <span className="font-serif font-semibold text-[16px] text-white">K</span>
          </div>
          <div>
            <div className="font-serif font-semibold text-[17px] leading-none tracking-[0.3px] text-ink">BraiderOS</div>
            <div className="text-[11px] text-muted mt-[3px] font-medium">Braid with Kez</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-[2px]">
          {SIDEBAR_NAV.map(({ id, label, Icon, badge }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  'flex items-center gap-3 w-full px-[13px] py-[11px] rounded-[13px] text-[13.5px] font-semibold border-none cursor-pointer transition-colors text-left',
                  isActive ? 'bg-plum-soft text-plum' : 'bg-transparent text-ink hover:bg-surface-2'
                )}
              >
                <span className="flex w-5 justify-center">
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="bg-plum text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-[9px] flex items-center justify-center px-[5px]">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto flex flex-col gap-2">
          <button onClick={onOpenPortal} className="flex items-center gap-[10px] px-[13px] py-[11px] border border-dashed border-line bg-transparent rounded-[13px] cursor-pointer text-ink text-[13px] font-semibold w-full hover:bg-surface-2 transition-colors">
            <ExternalLink size={17} strokeWidth={2} />
            <span className="flex-1 text-left">Booking page</span>
          </button>
          <div className="flex items-center gap-[10px] px-[6px] py-2 border-t border-line mt-1">
            <div className="w-[34px] h-[34px] rounded-full bg-plum flex items-center justify-center flex-none">
              <span className="font-serif font-semibold text-[12px] text-white">K</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[13px] text-ink">Kez Owusu</div>
              <div className="text-[11px] text-muted">Pro plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-dvh">

        {/* Header */}
        <header className="flex-none flex items-center justify-between px-4 md:px-6 py-3 bg-surface border-b border-line">
          <div className="flex items-center gap-[11px]">
            <div className="relative flex-none">
              <div className="w-10 h-10 rounded-full bg-plum flex items-center justify-center shadow-[0_2px_8px_rgba(110,27,58,0.16)]">
                <span className="font-serif font-semibold text-[15px] text-white">K</span>
              </div>
              <span className="absolute -right-px -bottom-px w-[11px] h-[11px] rounded-full bg-[#34C759] border-2 border-surface" />
            </div>
            <div>
              <div className="font-serif font-semibold text-[17px] leading-tight text-ink">{title}</div>
              <div className="text-[11.5px] text-muted font-medium mt-0.5">{sub}</div>
            </div>
          </div>
          <button onClick={onOpenPortal} className="flex items-center gap-[7px] bg-plum text-white h-[38px] px-[15px] rounded-[12px] text-[12.5px] font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity">
            <ExternalLink size={14} strokeWidth={2.2} />
            <span>Booking link</span>
          </button>
        </header>

        {/* Body: content + optional right panel */}
        <div className="flex flex-1 min-h-0">
          <main className={cn('flex-1 min-w-0 flex flex-col overflow-hidden', isChat && 'flex flex-col')}>
            {children}
          </main>

          {/* Desktop right context panel – chat only */}
          {isChat && (
            <aside className="hidden lg:flex flex-col w-[300px] flex-none border-l border-line bg-surface px-[18px] py-5 overflow-y-auto bos-scroll">
              <h3 className="font-serif font-semibold text-[16px] m-0 mb-[13px] text-ink">Today at a glance</h3>
              <div className="flex flex-col gap-2 mb-5">
                {TODAY_APPTS.map(a => (
                  <div key={a.name} className="flex items-center gap-[10px] bg-surface-2 rounded-[13px] px-[11px] py-[10px]">
                    <span
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white font-bold text-[12px] flex-none"
                      style={{ background: a.color }}
                    >
                      {a.initials}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[12.5px] text-ink">{a.name}</div>
                      <div className="text-[10.5px] text-muted">{a.time} {a.ampm} · {a.style}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-serif font-semibold text-[16px] m-0 mb-[11px] text-ink">Earnings</h3>
              <div className="bg-plum text-white rounded-[16px] p-[15px]">
                <div className="text-[11px] opacity-80 font-semibold">This week</div>
                <div className="font-serif font-bold text-[26px] mt-1">GH₵2,840</div>
                <div className="text-[11px] opacity-85 mt-1">▲ 18% vs last week</div>
              </div>
            </aside>
          )}
        </div>

        {/* Mobile bottom nav */}
        <BottomNav active={activeTab} onChange={onTabChange} />
      </div>
    </div>
  )
}
