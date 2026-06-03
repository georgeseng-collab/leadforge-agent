import { useQuery } from '@tanstack/react-query'
import { getExecutions, getExecutionDetail, discoverWorkflows } from '@/lib/n8n'
import type { N8nExecution, N8nExecutionDetail, N8nWorkflow } from '@/lib/n8n'

export function useN8nWorkflows() {
  return useQuery({
    queryKey: ['n8n-workflows'],
    queryFn: async () => {
      const workflows = await discoverWorkflows()
      return workflows as N8nWorkflow[]
    },
    staleTime: 60000,
    refetchInterval: 120000,
  })
}

export function useN8nExecutions(limit: number = 20) {
  return useQuery({
    queryKey: ['n8n-executions', limit],
    queryFn: async () => {
      const executions = await getExecutions(limit)
      return executions as N8nExecution[]
    },
    staleTime: 10000,
    refetchInterval: 15000, // Refresh every 15s to see new executions
  })
}

export function useN8nExecutionDetail(executionId: string | null) {
  return useQuery({
    queryKey: ['n8n-execution-detail', executionId],
    queryFn: async () => {
      if (!executionId) return null
      const detail = await getExecutionDetail(executionId)
      return detail as N8nExecutionDetail
    },
    enabled: !!executionId,
  })
}
