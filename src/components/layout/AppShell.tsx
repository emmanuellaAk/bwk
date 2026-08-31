import { useMemo } from 'react'
import {
  MessageCircle, LayoutDashboard, Calendar, Users,
  Package, Truck, BarChart2, ExternalLink, Settings, LogOut,
} from 'lucide-react'
import { BottomNav, type Tab } from './BottomNav'
import { cn } from '@/lib/utils'
import { initials as clientInitials, cedi } from '@/lib/braider'
import { useSettings } from '@/lib/api/hooks/useSettings'
import { useAppointments } from '@/lib/api/hooks/useAppointments'
import { useFinanceSummary } from '@/lib/api/hooks/useFinance'
import { useInventory } from '@/lib/api/hooks/useInventory'
import { useSuppliers } from '@/lib/api/hooks/useSuppliers'
import { useClients } from '@/lib/api/hooks/useClients'

const NAV_ITEMS = [
  { id: 'home' as Tab,      label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'chat' as Tab,      label: 'Chat',      Icon: MessageCircle },
  { id: 'calendar' as Tab,  label: 'Calendar',  Icon: Calendar },
  { id: 'clients' as Tab,   label: 'Clients',   Icon: Users },
  { id: 'inventory' as Tab, label: 'Inventory', Icon: Package },
  { id: 'suppliers' as Tab, label: 'Suppliers', Icon: Truck },
  { id: 'finance' as Tab,   label: 'Finance',   Icon: BarChart2 },
  { id: 'settings' as Tab,  label: 'Settings',  Icon: Settings },
]

function fmtApptTime(isoStr: string): { time: string; ampm: string } {
  const d = new Date(isoStr)
  const h = d.getHours()
  const m = d.getMinutes()
  const h12 = h % 12 || 12
  return { time: m === 0 ? `${h12}:00` : `${h12}:${m.toString().padStart(2, '0')}`, ampm: h < 12 ? 'AM' : 'PM' }
}

interface AppShellProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onOpenPortal: () => void
  onLogout: () => void
  children: React.ReactNode
}

export function AppShell({ activeTab, onTabChange, onOpenPortal, onLogout, children }: AppShellProps) {
  const isChat = activeTab === 'chat'
  const { data: salon } = useSettings()
  const ownerName  = salon?.owner_name ?? 'Kez'
  const salonName  = salon?.salon_name ?? 'BraiderOS'
  const ownerInit  = ownerName.charAt(0).toUpperCase()

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const todayEnd   = useMemo(() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d }, [])
  const { data: todayAppts }  = useAppointments(todayStart, todayEnd)
  const { data: weekSummary } = useFinanceSummary('week')
  const { data: inventory }   = useInventory()
  const { data: suppliers }   = useSuppliers()
  const { data: clientsPage } = useClients()

  const lowStockCount = (inventory ?? []).filter(i => i.status === 'low').length

  const sidebarNav = NAV_ITEMS.map(item =>
    item.id === 'inventory'
      ? { ...item, badge: lowStockCount > 0 ? String(lowStockCount) : null }
      : { ...item, badge: null as string | null }
  )

  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const header: Record<string, { title: string; sub: string }> = {
    chat:      { title: 'Kez AI',     sub: 'Your AI assistant · online' },
    home:      { title: 'Dashboard',  sub: "Today's overview" },
    calendar:  { title: 'Calendar',   sub: monthYear },
    clients:   { title: 'Customers',  sub: `${clientsPage?.items.length ?? 0} total` },
    inventory: { title: 'Inventory',  sub: `${inventory?.length ?? 0} items · ${lowStockCount} low` },
    suppliers: { title: 'Suppliers',  sub: `${suppliers?.length ?? 0} partners` },
    finance:   { title: 'Finance',    sub: 'This month' },
    settings:  { title: 'Settings',  sub: 'Salon & preferences' },
  }
  const { title, sub } = header[activeTab] ?? header.chat

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-[264px] flex-none border-r border-line bg-canvas px-5 py-6">
        {/* Brand */}
        <div className="flex items-center gap-[12px] px-1 pb-6">
          <div className="w-[44px] h-[44px] rounded-[15px] bg-plum flex items-center justify-center shadow-[0_12px_26px_rgba(106,24,56,0.18)] flex-none">
            <span className="font-serif font-semibold text-[17px] text-white">{ownerInit}</span>
          </div>
          <div className="min-w-0">
            <div className="font-serif font-semibold text-[17px] leading-none tracking-[0.2px] text-ink truncate">{salonName}</div>
            <div className="text-[11px] text-muted mt-[5px] font-medium">Salon workspace</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-[2px]">
          {sidebarNav.map(({ id, label, Icon, badge }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  'flex items-center gap-3 w-full px-[13px] py-[11px] rounded-[12px] text-[13.5px] font-semibold border border-transparent cursor-pointer transition-all text-left',
                  isActive ? 'bg-white text-plum shadow-[0_1px_10px_rgba(34,27,30,0.06)]' : 'bg-transparent text-ink/75 hover:bg-white/65 hover:text-ink'
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
          <button onClick={onOpenPortal} className="flex items-center gap-[10px] px-[13px] py-[11px] border border-line bg-white rounded-[12px] cursor-pointer text-ink text-[13px] font-semibold w-full hover:border-plum/25 hover:shadow-[0_1px_10px_rgba(34,27,30,0.06)] transition-all">
            <ExternalLink size={17} strokeWidth={2} />
            <span className="flex-1 text-left">Booking page</span>
          </button>
          <div className="flex items-center gap-[10px] px-[6px] py-2 border-t border-line mt-1">
            <div className="w-[34px] h-[34px] rounded-full bg-plum flex items-center justify-center flex-none">
              <span className="font-serif font-semibold text-[12px] text-white">{ownerInit}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[13px] text-ink">{ownerName}</div>
              <div className="text-[11px] text-muted">Pro plan</div>
            </div>
            <button
              onClick={onLogout}
              className="w-[30px] h-[30px] flex items-center justify-center rounded-[9px] bg-transparent border border-line text-muted cursor-pointer hover:bg-surface-2 hover:text-ink transition-colors flex-none"
              title="Sign out"
            >
              <LogOut size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full">

        {/* Header */}
        <header className="flex-none flex items-center justify-between px-4 md:px-7 py-4 bg-canvas/90 backdrop-blur border-b border-line">
          <div className="flex items-center gap-[11px]">
            <div className="relative flex-none">
              <div className="w-10 h-10 rounded-full bg-plum flex items-center justify-center shadow-[0_2px_8px_rgba(110,27,58,0.16)]">
                <span className="font-serif font-semibold text-[15px] text-white">{ownerInit}</span>
              </div>
              <span className="absolute -right-px -bottom-px w-[11px] h-[11px] rounded-full bg-[#34C759] border-2 border-surface" />
            </div>
            <div>
              <div className="font-serif font-semibold text-[17px] leading-tight text-ink">{title}</div>
              <div className="text-[11.5px] text-muted font-medium mt-0.5">{sub}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTabChange('settings')}
              className="md:hidden w-[38px] h-[38px] flex items-center justify-center rounded-[12px] bg-surface-2 border border-line text-muted cursor-pointer hover:bg-white hover:text-ink transition-colors"
              aria-label="Settings"
            >
              <Settings size={16} strokeWidth={1.8} />
            </button>
            <button onClick={onOpenPortal} className="flex items-center gap-[7px] bg-plum text-white h-[39px] px-[16px] rounded-[12px] text-[12.5px] font-semibold cursor-pointer border-none shadow-[0_8px_20px_rgba(106,24,56,0.18)] hover:bg-plum-2 transition-colors">
              <ExternalLink size={14} strokeWidth={2.2} />
              <span>Booking link</span>
            </button>
          </div>
        </header>

        {/* Body: content + optional right panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className={cn('flex-1 min-w-0 flex flex-col overflow-hidden bg-canvas', isChat && 'flex flex-col')}>
            {children}
          </main>

          {/* Desktop right context panel – chat only */}
          {isChat && (
            <aside className="hidden lg:flex flex-col w-[320px] flex-none border-l border-line bg-canvas px-[20px] py-6 overflow-y-auto bos-scroll">
              <h3 className="font-serif font-semibold text-[16px] m-0 mb-[13px] text-ink">Today at a glance</h3>
              <div className="flex flex-col gap-2 mb-5">
                {(todayAppts ?? []).length === 0 && (
                  <div className="text-[12px] text-muted bg-surface-2 rounded-[14px] px-[12px] py-[14px] text-center">
                    No appointments today
                  </div>
                )}
                {(todayAppts ?? []).map(a => {
                  const { time, ampm } = fmtApptTime(a.starts_at)
                  const name = a.client_name ?? 'Client'
                  return (
                    <div key={a.id} className="flex items-center gap-[10px] bg-white border border-line rounded-[14px] px-[12px] py-[11px] shadow-[0_1px_8px_rgba(34,27,30,0.04)]">
                      <span
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white font-bold text-[12px] flex-none"
                        style={{ background: a.color_hex }}
                      >
                        {clientInitials(name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[12.5px] text-ink">{name}</div>
                        <div className="text-[10.5px] text-muted">{time} {ampm} · {a.service_name ?? a.notes ?? '—'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <h3 className="font-serif font-semibold text-[16px] m-0 mb-[11px] text-ink">Earnings</h3>
              <div className="bg-plum text-white rounded-[18px] p-[17px] shadow-[0_16px_34px_rgba(106,24,56,0.18)]">
                <div className="text-[11px] opacity-80 font-semibold">This week</div>
                <div className="font-serif font-bold text-[27px] mt-1 tracking-[-0.3px]">{cedi(weekSummary?.revenue ?? 0)}</div>
                <div className="text-[11px] opacity-85 mt-2">
                  {weekSummary?.delta_pct != null
                    ? `${weekSummary.delta_pct >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(weekSummary.delta_pct))}% vs last week`
                    : 'No prior data'}
                </div>
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
