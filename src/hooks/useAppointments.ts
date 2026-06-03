import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { QualifiedLead, AppointmentStatus } from '@/lib/types'

export function useAppointments(filters?: {
  status?: AppointmentStatus
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      let query = supabase
        .from('qualified_leads')
        .select('*')
        .not('appointment_date', 'is', null)
        .order('appointment_date', { ascending: true })

      if (filters?.status) query = query.eq('appointment_status', filters.status)
      if (filters?.dateFrom) query = query.gte('appointment_date', filters.dateFrom)
      if (filters?.dateTo) query = query.lte('appointment_date', filters.dateTo)

      const { data, error } = await query
      if (error) throw error
      return (data || []) as QualifiedLead[]
    },
  })
}

export function useAppointmentsToday() {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['appointments-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qualified_leads')
        .select('*')
        .gte('appointment_date', today)
        .lt('appointment_date', `${today}T23:59:59`)
        .order('appointment_date', { ascending: true })
      if (error) throw error
      return (data || []) as QualifiedLead[]
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, date, status }: { id: string; date?: string; status?: AppointmentStatus }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (date) updates.appointment_date = date
      if (status) updates.appointment_status = status
      const { data, error } = await supabase
        .from('qualified_leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as QualifiedLead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
    },
  })
}
