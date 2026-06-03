import { useState } from 'react'
import { useN8nWorkflows, useN8nExecutions, useN8nExecutionDetail } from '@/hooks/useN8n'
import { activateWorkflow } from '@/lib/n8n'
import { Activity, RefreshCw, ExternalLink, ChevronRight, Clock, CheckCircle2, XCircle, Loader2, Zap, Eye, Play, AlertTriangle } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'

export default function N8nMonitor() {
  const { data: workflows, isLoading: wfLoading, refetch: refetchWf, error: wfError } = useN8nWorkflows()
  const { data: executions, isLoading: exLoading, refetch: refetchEx, isRefetching, error: exError } = useN8nExecutions(30)
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null)
  const { data: execDetail } = useN8nExecutionDetail(selectedExecId)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const refetchAll = () => {
    refetchWf()
    refetchEx()
  }

  const handleActivate = async (wfId: string) => {
    setActivatingId(wfId)
    try {
      await activateWorkflow(wfId)
      refetchWf()
    } catch (e) {
      console.error('Failed to activate workflow:', e)
    } finally {
      setActivatingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />
      case 'waiting':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />
      case 'running':
        return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
      default:
        return <Clock className="w-3.5 h-3.5 text-gray-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      success: 'Completed',
      error: 'Failed',
      waiting: 'Waiting',
      running: 'Running',
      canceled: 'Canceled',
      unknown: 'Unknown',
    }
    return map[status] || status
  }

  // Parse execution output from detail
  const getExecutionOutputs = () => {
    if (!execDetail?.data?.resultData?.runData) return []
    const outputs: Array<{ nodeName: string; output: Record<string, unknown>; executionTime: number; status: string }> = []

    for (const [nodeName, runs] of Object.entries(execDetail.data.resultData.runData)) {
      for (const run of runs) {
        const mainData = run.data?.main?.[0]?.[0]?.json
        outputs.push({
          nodeName,
          output: mainData || { note: 'No output data' },
          executionTime: run.executionTime,
          status: run.executionStatus,
        })
      }
    }

    return outputs
  }

  const hasError = wfError || exError
  const errorMessage = (wfError as any)?.message || (exError as any)?.message

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            n8n Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time visibility into n8n workflow executions</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://leadforge.app.n8n.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open n8n
          </a>
          <button
            onClick={refetchAll}
            disabled={isRefetching}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isRefetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Connection Error */}
      {hasError && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">n8n Connection Issue</p>
            <p className="text-xs text-amber-400/70 mt-1">
              {errorMessage?.includes('timed out')
                ? 'n8n Cloud is taking too long to respond. This usually means the n8n instance is waking up from sleep mode. Try refreshing in 30 seconds.'
                : errorMessage?.includes('not configured')
                ? 'The n8n API key is not set on the server. Go to Settings to configure it.'
                : errorMessage || 'Could not connect to n8n Cloud. Check your n8n instance is running.'}
            </p>
          </div>
        </div>
      )}

      {/* Workflows */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Workflows
          {workflows && <span className="text-[10px] text-gray-500 font-normal">({workflows.filter(w => w.active).length}/{workflows.length} active)</span>}
        </h2>
        {wfLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading workflows...</span>
          </div>
        ) : !workflows || workflows.length === 0 ? (
          <div className="text-center py-6">
            <Zap className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No n8n workflows found</p>
            <p className="text-xs text-gray-600 mt-1">
              Create workflows in your n8n Cloud instance at{' '}
              <a href="https://leadforge.app.n8n.cloud" target="_blank" className="text-emerald-400 hover:underline">
                leadforge.app.n8n.cloud
              </a>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  wf.active ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-gray-800 bg-gray-900/30'
                )}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{wf.name}</p>
                  <p className="text-[10px] text-gray-500">ID: {wf.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!wf.active && (
                    <button
                      onClick={() => handleActivate(wf.id)}
                      disabled={activatingId === wf.id}
                      className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-emerald-400 transition-colors"
                      title="Activate workflow"
                    >
                      {activatingId === wf.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    wf.active ? 'bg-emerald-400' : 'bg-gray-600'
                  )} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Executions */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          Recent Executions
          {executions && <span className="text-[10px] text-gray-500 font-normal">({executions.length})</span>}
        </h2>
        {exLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading executions...</span>
          </div>
        ) : !executions || executions.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No executions yet</p>
            <p className="text-xs text-gray-600 mt-1">Trigger a workflow from the Dashboard to see results here.</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[calc(100vh-500px)] overflow-y-auto">
            {executions.map((exec) => (
              <button
                key={exec.id}
                onClick={() => setSelectedExecId(selectedExecId === String(exec.id) ? null : String(exec.id))}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  selectedExecId === String(exec.id)
                    ? 'bg-gray-800 border border-gray-700'
                    : 'hover:bg-gray-900/50'
                )}
              >
                {getStatusIcon(exec.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-white truncate">
                      {exec.workflowData?.name || `Workflow ${exec.workflowId}`}
                    </p>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded font-medium',
                      exec.status === 'success' && 'bg-emerald-500/10 text-emerald-400',
                      exec.status === 'error' && 'bg-red-500/10 text-red-400',
                      exec.status === 'running' && 'bg-blue-500/10 text-blue-400',
                      exec.status === 'waiting' && 'bg-amber-500/10 text-amber-400',
                    )}>
                      {getStatusLabel(exec.status)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    ID: {exec.id} · {exec.startedAt ? timeAgo(exec.startedAt) : 'Unknown time'}
                  </p>
                </div>
                <ChevronRight className={cn(
                  'w-3.5 h-3.5 text-gray-600 transition-transform',
                  selectedExecId === String(exec.id) && 'rotate-90'
                )} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Execution Detail */}
      {selectedExecId && execDetail && (
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            Execution Detail — #{selectedExecId}
          </h2>

          {/* Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-900/50 rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Workflow</p>
              <p className="text-xs text-white">{execDetail.workflowData?.name || 'Unknown'}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Status</p>
              <p className={cn(
                'text-xs font-medium',
                execDetail.status === 'success' && 'text-emerald-400',
                execDetail.status === 'error' && 'text-red-400',
                execDetail.status === 'running' && 'text-blue-400',
              )}>{getStatusLabel(execDetail.status)}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Started</p>
              <p className="text-xs text-white">{execDetail.startedAt ? timeAgo(execDetail.startedAt) : '—'}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-2">
              <p className="text-[10px] text-gray-500">Finished</p>
              <p className="text-xs text-white">{execDetail.finished ? (execDetail.stoppedAt ? timeAgo(execDetail.stoppedAt) : 'Yes') : 'No'}</p>
            </div>
          </div>

          {/* Node outputs */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Node Outputs</h3>
            {getExecutionOutputs().length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-3">No output data available for this execution</p>
            ) : (
              getExecutionOutputs().map((out, i) => (
                <div key={i} className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white">{out.nodeName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">{out.executionTime}ms</span>
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded',
                        out.status === 'success' && 'bg-emerald-500/10 text-emerald-400',
                        out.status === 'error' && 'bg-red-500/10 text-red-400',
                      )}>
                        {out.status}
                      </span>
                    </div>
                  </div>
                  <pre className="text-[10px] text-gray-300 bg-black/30 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(out.output, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
