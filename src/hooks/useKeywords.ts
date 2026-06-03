import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdaptiveKeyword, KeywordCategory } from '@/lib/types'

export function useKeywords(filters?: {
  category?: KeywordCategory
  isActive?: boolean
  search?: string
}) {
  return useQuery({
    queryKey: ['keywords', filters],
    queryFn: async () => {
      let query = supabase
        .from('adaptive_keywords')
        .select('*')
        .order('intent_weight', { ascending: false })

      if (filters?.category) query = query.eq('category', filters.category)
      if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive)
      if (filters?.search) {
        query = query.ilike('keyword', `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as AdaptiveKeyword[]
    },
  })
}

export function useTopKeywords(limit: number = 10) {
  return useQuery({
    queryKey: ['top-keywords', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adaptive_keywords')
        .select('*')
        .eq('is_active', true)
        .order('frequency_count', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data || []) as AdaptiveKeyword[]
    },
  })
}

export function useAddKeyword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (keyword: Omit<AdaptiveKeyword, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('adaptive_keywords')
        .insert(keyword)
        .select()
        .single()
      if (error) throw error
      return data as AdaptiveKeyword
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
      queryClient.invalidateQueries({ queryKey: ['top-keywords'] })
    },
  })
}

export function useToggleKeyword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('adaptive_keywords')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as AdaptiveKeyword
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
      queryClient.invalidateQueries({ queryKey: ['top-keywords'] })
    },
  })
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('adaptive_keywords')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
      queryClient.invalidateQueries({ queryKey: ['top-keywords'] })
    },
  })
}
