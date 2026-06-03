import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Conversation } from '@/lib/types'

export function useConversations(leadId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', leadId],
    queryFn: async () => {
      if (!leadId) return []
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', leadId)
        .order('sent_at', { ascending: true })
      if (error) throw error
      return (data || []) as Conversation[]
    },
    enabled: !!leadId,
  })
}

export function useRecentConversations(limit: number = 10) {
  return useQuery({
    queryKey: ['recent-conversations', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data || []) as Conversation[]
    },
  })
}
