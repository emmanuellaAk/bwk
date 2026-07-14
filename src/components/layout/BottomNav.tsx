import { LayoutDashboard, Calendar, MessageCircle, Users, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tab = 'home' | 'calendar' | 'chat' | 'clients' | 'finance' | 'inventory' | 'suppliers' | 'services'

interface NavItem {
  id: Tab
  label?: string
  Icon: React.FC<{ size?: number; strokeWidth?: number }>
  center?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',     label: 'Home',     Icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'chat',     center: true,      Icon: MessageCircle },
  { id: 'clients',  label: 'Clients',  Icon: Users },
  { id: 'finance',  label: 'Finance',  Icon: BarChart2 },
]

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="md:hidden flex-none bg-surface border-t border-line flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map(({ id, label, Icon, center }) => {
        const isActive = active === id

        if (center) {
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="-mt-[26px] w-[58px] h-[58px] rounded-full border-4 border-surface bg-plum text-white cursor-pointer flex items-center justify-center shadow-[0_8px_20px_rgba(110,27,58,0.35)] border-none outline-none"
              style={{ border: '4px solid white' }}
            >
              <Icon size={24} strokeWidth={2} />
            </button>
          )
        }

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'flex flex-col items-center gap-[3px] py-3 px-3 flex-1 bg-transparent border-none cursor-pointer transition-colors',
              isActive ? 'text-plum' : 'text-muted'
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="text-[9.5px] font-semibold">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
