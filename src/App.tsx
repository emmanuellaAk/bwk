import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { ChatHome } from '@/components/chat/ChatHome'
import { CalendarPage } from '@/pages/CalendarPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { FinancePage } from '@/pages/FinancePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { SuppliersPage } from '@/pages/SuppliersPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { BookingPortal } from '@/components/portal/BookingPortal'
import { LoginPage } from '@/pages/LoginPage'
import type { Tab } from '@/components/layout/BottomNav'

const queryClient = new QueryClient()

function BraiderOS() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab,      setTab]      = useState<Tab>('home')
  const [portal,   setPortal]   = useState(false)

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />

  return (
    <>
      <AppShell activeTab={tab} onTabChange={setTab} onOpenPortal={() => setPortal(true)}>
        {tab === 'chat'      && <ChatHome />}
        {tab === 'home'      && <DashboardPage onNavigate={setTab} />}
        {tab === 'calendar'  && <CalendarPage />}
        {tab === 'clients'   && <ClientsPage onNavigate={setTab} />}
        {tab === 'finance'   && <FinancePage />}
        {tab === 'inventory' && <InventoryPage onNavigate={setTab} />}
        {tab === 'suppliers' && <SuppliersPage />}
        {tab === 'services'  && <ServicesPage />}
        {tab === 'settings'  && <SettingsPage />}
      </AppShell>
      {portal && <BookingPortal onClose={() => setPortal(false)} />}
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BraiderOS />
    </QueryClientProvider>
  )
}
