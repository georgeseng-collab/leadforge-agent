import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { QualifiedLead, QualifiedLeadUpdate, PipelineStage, Tier } from '@/lib/types'

export function useLeads(filters?: {
  tier?: Tier
  pipelineStage?: PipelineStage
  platform?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('qualified_leads')
        .select('*')
        .order('qualification_score', { ascending: false })

      if (filters?.tier) query = query.eq('priority_tier', filters.tier)
      if (filters?.pipelineStage) query = query.eq('pipeline_stage', filters.pipelineStage)
      if (filters?.platform) query = query.eq('platform', filters.platform)
      if (filters?.search) {
        query = query.or(`username.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as QualifiedLead[]
    },
  })
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('qualified_leads')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as QualifiedLead
    },
    enabled: !!id,
  })
}

export function useLeadStats() {
  return useQuery({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      const { count: totalLeads } = await supabase
        .from('qualified_leads')
        .select('*', { count: 'exact', head: true })

      const { count: tier1Count } = await supabase
        .from('qualified_leads')
        .select('*', { count: 'exact', head: true })
        .eq('priority_tier', 'tier1')

      const today = new Date().toISOString().split('T')[0]
      const { count: appointmentsToday } = await supabase
        .from('qualified_leads')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', today)
        .lt('appointment_date', `${today}T23:59:59`)

      const { count: closedWon } = await supabase
        .from('qualified_leads')
        .select('*', { count: 'exact', head: true })
        .eq('pipeline_stage', 'closed_won')

      const conversionRate = totalLeads && totalLeads > 0
        ? ((closedWon || 0) / totalLeads) * 100
        : 0

      return {
        totalLeads: totalLeads || 0,
        tier1Count: tier1Count || 0,
        appointmentsToday: appointmentsToday || 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
        closedWon: closedWon || 0,
      }
    },
  })
}

export function usePipelineCounts() {
  return useQuery({
    queryKey: ['pipeline-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qualified_leads')
        .select('pipeline_stage')
      if (error) throw error

      const counts: Record<string, number> = {}
      const stages = ['new', 'contacted', 'responded', 'appointment_set', 'closed_won', 'closed_lost']
      stages.forEach(s => counts[s] = 0)
      ;(data || []).forEach((row: { pipeline_stage: string }) => {
        if (counts[row.pipeline_stage] !== undefined) {
          counts[row.pipeline_stage]++
        }
      })
      return counts
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: QualifiedLeadUpdate }) => {
      const { data, error } = await supabase
        .from('qualified_leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as QualifiedLead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-counts'] })
    },
  })
}
