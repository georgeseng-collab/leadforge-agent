import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CompetitorSource, CompetitorSourceInsert, CompetitorSourceUpdate } from '@/lib/types'

export function useCompetitors() {
  return useQuery({
    queryKey: ['competitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitor_sources')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as CompetitorSource[]
    },
  })
}

export function useAddCompetitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (competitor: CompetitorSourceInsert) => {
      const { data, error } = await supabase
        .from('competitor_sources')
        .insert(competitor)
        .select()
        .single()
      if (error) throw error
      return data as CompetitorSource
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
    },
  })
}

export function useUpdateCompetitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CompetitorSourceUpdate }) => {
      const { data, error } = await supabase
        .from('competitor_sources')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CompetitorSource
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
    },
  })
}

export function useDeleteCompetitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('competitor_sources')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
    },
  })
}

export function useToggleCompetitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('competitor_sources')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CompetitorSource
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
    },
  })
}
