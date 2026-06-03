import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Activity,
  CheckSquare,
  Users,
  Building2,
  Search,
  Radar,
  Calendar,
  Terminal,
  Settings,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { usePendingCount } from '@/hooks/useApprovalQueue'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/live-feed', label: 'Live Feed', icon: Activity },
  { path: '/approval-queue', label: 'Approval Queue', icon: CheckSquare, badge: true },
  { path: '/leads', label: 'Leads Pipeline', icon: Users },
  { path: '/competitors', label: 'Competitors', icon: Building2 },
  { path: '/discovery', label: 'Live Discovery', icon: Radar },
  { path: '/keywords', label: 'Keywords', icon: Search },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/agent-logs', label: 'Agent Logs', icon: Terminal },
  { path: '/n8n-monitor', label: 'n8n Monitor', icon: Zap },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: pendingCount } = usePendingCount()

  const currentPath = location.pathname

  const handleNav = useCallback((path: string) => {
    navigate(path)
    setSidebarOpen(false)
  }, [navigate])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location])

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0f0f12] border-r border-gray-800 flex flex-col transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white">LeadForge</h1>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">AI Agent</p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px]', isActive && 'text-emerald-400')} />
                <span>{item.label}</span>
                {item.badge && pendingCount !== undefined && pendingCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow text-emerald-400" />
            <span className="text-xs text-gray-500">System Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-gray-800 flex items-center px-4 lg:px-6 shrink-0 bg-[#0c0c0f]">
          <button
            className="lg:hidden text-gray-400 hover:text-white mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="text-gray-600">LeadForge</span>
            <span className="text-gray-700">/</span>
            <span className="text-white">
              {NAV_ITEMS.find(i => i.path === currentPath)?.label || 'Dashboard'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">24/7 Active</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
