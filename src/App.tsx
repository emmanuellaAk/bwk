import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { ChatHome } from '@/components/chat/ChatHome'
import { CalendarPage } from '@/pages/CalendarPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { FinancePage } from '@/pages/FinancePage'
import { DashboardPage } from '@/pages/DashboardPage'
import type { Tab } from '@/components/layout/BottomNav'

const queryClient = new QueryClient()

function BraiderOS() {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <AppShell activeTab={tab} onTabChange={setTab}>
      {tab === 'chat'      && <ChatHome />}
      {tab === 'home'      && <DashboardPage onNavigate={setTab} />}
      {tab === 'calendar'  && <CalendarPage />}
      {tab === 'clients'   && <ClientsPage />}
      {tab === 'finance'   && <FinancePage />}
      {tab === 'inventory' && <DashboardPage onNavigate={setTab} />}
      {tab === 'suppliers' && <DashboardPage onNavigate={setTab} />}
    </AppShell>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BraiderOS />
    </QueryClientProvider>
  )
}
