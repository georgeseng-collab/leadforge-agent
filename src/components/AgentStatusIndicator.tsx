import type { AgentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AgentStatusIndicatorProps {
  status: AgentStatus
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export default function AgentStatusIndicator({
  status,
  label,
  showLabel = true,
  size = 'sm',
  className,
}: AgentStatusIndicatorProps) {
  const statusConfig: Record<AgentStatus, { color: string; bgColor: string; label: string }> = {
    running: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', label: 'Running' },
    completed: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Completed' },
    failed: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', label: 'Failed' },
    pending: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', label: 'Pending' },
  }

  const config = statusConfig[status]
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      <span
        className={cn(dotSize, 'rounded-full', status === 'running' && 'animate-pulse')}
        style={{ backgroundColor: config.color }}
      />
      {showLabel && <span>{label || config.label}</span>}
    </span>
  )
}
