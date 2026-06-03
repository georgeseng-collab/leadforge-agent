import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import LiveFeed from '@/pages/LiveFeed'
import ApprovalQueue from '@/pages/ApprovalQueue'
import LeadsPipeline from '@/pages/LeadsPipeline'
import Competitors from '@/pages/Competitors'
import Discovery from '@/pages/Discovery'
import Keywords from '@/pages/Keywords'
import Appointments from '@/pages/Appointments'
import AgentLogs from '@/pages/AgentLogs'
import N8nMonitor from '@/pages/N8nMonitor'
import Settings from '@/pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live-feed" element={<LiveFeed />} />
            <Route path="/approval-queue" element={<ApprovalQueue />} />
            <Route path="/leads" element={<LeadsPipeline />} />
            <Route path="/competitors" element={<Competitors />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/keywords" element={<Keywords />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/agent-logs" element={<AgentLogs />} />
            <Route path="/n8n-monitor" element={<N8nMonitor />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
