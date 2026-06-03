import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TrendSignal } from '@/lib/types'

export function useTrends(filters?: {
  trendType?: string
  platform?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['trends', filters],
    queryFn: async () => {
      let query = supabase
        .from('trend_signals')
        .select('*')
        .order('relevance_score', { ascending: false })

      if (filters?.trendType) query = query.eq('trend_type', filters.trendType)
      if (filters?.platform) query = query.eq('platform', filters.platform)
      if (filters?.limit) query = query.limit(filters.limit)
      else query = query.limit(50)

      const { data, error } = await query
      if (error) throw error
      return (data || []) as TrendSignal[]
    },
  })
}

export function useRecentTrends(limit: number = 10) {
  return useQuery({
    queryKey: ['recent-trends', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trend_signals')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data || []) as TrendSignal[]
    },
    refetchInterval: 60000,
  })
}
