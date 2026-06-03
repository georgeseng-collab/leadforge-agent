import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RawCommenter } from '@/lib/types'

export function useLiveFeed(limit: number = 50) {
  return useQuery({
    queryKey: ['live-feed', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_commenters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data || []) as RawCommenter[]
    },
    refetchInterval: 30000,
  })
}
