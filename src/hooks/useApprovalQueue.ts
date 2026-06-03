import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MessageQueue, MessageQueueUpdate, ApprovalStatus } from '@/lib/types'

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['approval-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_queue')
        .select(`
          *,
          qualified_leads:message_queue_lead_id_fkey (
            id, username, display_name, priority_tier, platform, profile_pic_url, qualification_score
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: true })
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('message_queue')
          .select('*')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: true })
        if (fallbackError) throw fallbackError
        return (fallbackData || []) as MessageQueue[]
      }
      return (data || []) as MessageQueue[]
    },
    refetchInterval: 15000,
  })
}

export function usePendingCount() {
  return useQuery({
    queryKey: ['pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('message_queue')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending')
      if (error) throw error
      return count || 0
    },
    refetchInterval: 10000,
  })
}

export function useUpdateMessageStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, errorMessage }: { id: string; status: ApprovalStatus; errorMessage?: string }) => {
      const updates: MessageQueueUpdate = {
        approval_status: status,
        updated_at: new Date().toISOString(),
      }
      if (status === 'sent') updates.sent_at = new Date().toISOString()
      if (errorMessage) updates.error_message = errorMessage
      const { data, error } = await supabase
        .from('message_queue')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as MessageQueue
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] })
      queryClient.invalidateQueries({ queryKey: ['pending-count'] })
    },
  })
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ApprovalStatus }) => {
      const updates: MessageQueueUpdate = {
        approval_status: status,
        updated_at: new Date().toISOString(),
      }
      if (status === 'sent') updates.sent_at = new Date().toISOString()
      const { error } = await supabase
        .from('message_queue')
        .update(updates)
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] })
      queryClient.invalidateQueries({ queryKey: ['pending-count'] })
    },
  })
}

export function useEditMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, messageText }: { id: string; messageText: string }) => {
      const { data, error } = await supabase
        .from('message_queue')
        .update({ message_text: messageText, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as MessageQueue
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] })
    },
  })
}
