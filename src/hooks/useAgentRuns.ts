import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AgentRun, AgentType, AgentStatus } from '@/lib/types'

export function useAgentRuns(filters?: {
  agentType?: AgentType
  status?: AgentStatus
  limit?: number
}) {
  return useQuery({
    queryKey: ['agent-runs', filters],
    queryFn: async () => {
      let query = supabase
        .from('agent_runs')
        .select('*')
        .order('started_at', { ascending: false })

      if (filters?.agentType) query = query.eq('agent_type', filters.agentType)
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.limit) query = query.limit(filters.limit)
      else query = query.limit(50)

      const { data, error } = await query
      if (error) throw error
      return (data || []) as AgentRun[]
    },
  })
}

export function useLatestAgentRuns() {
  return useQuery({
    queryKey: ['latest-agent-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data || []) as AgentRun[]
    },
    refetchInterval: 30000,
  })
}

export function useAgentStatus() {
  return useQuery({
    queryKey: ['agent-status'],
    queryFn: async () => {
      const agentTypes: AgentType[] = ['scout', 'qualifier', 'dm_sender', 'contact_extractor', 'keyword_evolver', 'appointment_booker']
      const statuses: Record<AgentType, { status: AgentStatus; lastRun: string | null }> = {} as any

      for (const type of agentTypes) {
        const { data } = await supabase
          .from('agent_runs')
          .select('status, started_at')
          .eq('agent_type', type)
          .order('started_at', { ascending: false })
          .limit(1)

        if (data && data.length > 0) {
          statuses[type] = {
            status: data[0].status as AgentStatus,
            lastRun: data[0].started_at,
          }
        } else {
          statuses[type] = { status: 'pending', lastRun: null }
        }
      }

      return statuses
    },
    refetchInterval: 30000,
  })
}
