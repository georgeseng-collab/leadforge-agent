import { useState } from 'react'
import { useAgentRuns } from '@/hooks/useAgentRuns'
import AgentStatusIndicator from '@/components/AgentStatusIndicator'
import { AGENT_TYPE_CONFIG, type AgentType, type AgentStatus } from '@/lib/types'
import { cn, timeAgo, formatDuration, truncate } from '@/lib/utils'
import { Terminal, ChevronDown, ChevronUp, Filter, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function AgentLogs() {
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: runs, isLoading } = useAgentRuns({
    agentType: agentFilter !== 'all' ? (agentFilter as AgentType) : undefined,
    status: statusFilter !== 'all' ? (statusFilter as AgentStatus) : undefined,
    limit: 100,
  })

  const statusIcons: Record<string, typeof CheckCircle> = {
    completed: CheckCircle,
    running: Loader,
    failed: XCircle,
    pending: Clock,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            Agent Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Execution history for all agent workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="all">All Agents</option>
            {Object.entries(AGENT_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Logs */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading agent logs...</div>
      ) : (runs || []).length === 0 ? (
        <div className="text-center py-12">
          <Terminal className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No agent runs recorded yet</p>
          <p className="text-gray-600 text-xs mt-1">Agent execution logs will appear here when workflows run</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto">
          {(runs || []).map((run) => {
            const isExpanded = expandedId === run.id
            const StatusIcon = statusIcons[run.status] || Clock
            const agentConfig = AGENT_TYPE_CONFIG[run.agent_type as AgentType]

            return (
              <div
                key={run.id}
                className={cn(
                  'bg-[#111113] border rounded-lg overflow-hidden transition-all',
                  run.status === 'completed' ? 'border-emerald-500/20' :
                  run.status === 'running' ? 'border-amber-500/20' :
                  run.status === 'failed' ? 'border-red-500/20' :
                  'border-gray-800'
                )}
              >
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-900/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : run.id)}
                >
                  <StatusIcon className={cn(
                    'w-4 h-4 shrink-0',
                    run.status === 'running' && 'animate-spin-slow',
                    run.status === 'completed' && 'text-emerald-400',
                    run.status === 'failed' && 'text-red-400',
                    run.status === 'running' && 'text-amber-400',
                    run.status === 'pending' && 'text-gray-500',
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {agentConfig?.label || run.agent_type}
                      </span>
                      <AgentStatusIndicator status={run.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                      <span>{run.items_processed} processed</span>
                      {run.items_failed > 0 && (
                        <span className="text-red-400">{run.items_failed} failed</span>
                      )}
                      <span>·</span>
                      <span>{formatDuration(run.duration_ms)}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-600 shrink-0">{timeAgo(run.started_at)}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600 shrink-0" />
                  )}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3 animate-fade-in">
                    {run.input_summary && (
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Input</label>
                        <div className="bg-gray-900/50 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap">
                          {run.input_summary}
                        </div>
                      </div>
                    )}
                    {run.output_summary && (
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Output</label>
                        <div className="bg-gray-900/50 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap">
                          {run.output_summary}
                        </div>
                      </div>
                    )}
                    {run.error_message && (
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Error</label>
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-xs text-red-300 whitespace-pre-wrap">
                          {run.error_message}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-[10px] text-gray-600">
                      <span>Started: {run.started_at}</span>
                      {run.completed_at && <span>Completed: {run.completed_at}</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
