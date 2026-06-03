import { useState, useMemo } from 'react'
import { useAppointments, useUpdateAppointment, useAppointmentsToday } from '@/hooks/useAppointments'
import { useConversations } from '@/hooks/useConversations'
import TierBadge from '@/components/TierBadge'
import PlatformBadge from '@/components/PlatformBadge'
import ConversationThread from '@/components/ConversationThread'
import ContactExtractor from '@/components/ContactExtractor'
import { TIER_CONFIG, type QualifiedLead, type AppointmentStatus } from '@/lib/types'
import { cn, formatDate, formatFullDate, timeAgo } from '@/lib/utils'
import { Calendar, Clock, ChevronLeft, ChevronRight, X, MapPin, User, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isToday } from 'date-fns'

export default function Appointments() {
  const [selectedLead, setSelectedLead] = useState<QualifiedLead | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [conversationsLeadId, setConversationsLeadId] = useState<string | null>(null)

  const { data: appointments, isLoading } = useAppointments({
    status: statusFilter !== 'all' ? (statusFilter as AppointmentStatus) : undefined,
  })

  const { data: conversations } = useConversations(conversationsLeadId ?? undefined)
  const updateAppointment = useUpdateAppointment()

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd })

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, QualifiedLead[]> = {}
    days.forEach(d => {
      map[format(d, 'yyyy-MM-dd')] = []
    })
    ;(appointments || []).forEach(apt => {
      if (!apt.appointment_date) return
      try {
        const day = format(parseISO(apt.appointment_date), 'yyyy-MM-dd')
        if (map[day]) map[day].push(apt)
      } catch {}
    })
    return map
  }, [appointments, days])

  const getStatusBadge = (status: AppointmentStatus | null) => {
    switch (status) {
      case 'confirmed':
        return <span className="text-[10px] bg-emerald-500/10 text-emerald-400 rounded px-1.5 py-0.5 flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" />Confirmed</span>
      case 'pending':
        return <span className="text-[10px] bg-amber-500/10 text-amber-400 rounded px-1.5 py-0.5 flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" />Pending</span>
      case 'rescheduled':
        return <span className="text-[10px] bg-blue-500/10 text-blue-400 rounded px-1.5 py-0.5 flex items-center gap-0.5"><RefreshCw className="w-2.5 h-2.5" />Rescheduled</span>
      case 'cancelled':
        return <span className="text-[10px] bg-red-500/10 text-red-400 rounded px-1.5 py-0.5 flex items-center gap-0.5"><X className="w-2.5 h-2.5" />Cancelled</span>
      case 'completed':
        return <span className="text-[10px] bg-gray-500/10 text-gray-400 rounded px-1.5 py-0.5 flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" />Completed</span>
      default:
        return <span className="text-[10px] bg-gray-700 text-gray-400 rounded px-1.5 py-0.5">Unknown</span>
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Appointments
          </h1>
          <p className="text-sm text-gray-500 mt-1">{appointments?.length || 0} appointments scheduled</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-0.5 border border-gray-800">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn('px-3 py-1 text-xs rounded-md', viewMode === 'calendar' ? 'bg-gray-800 text-white' : 'text-gray-500')}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('px-3 py-1 text-xs rounded-md', viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Main Content */}
        <div className={cn('flex-1', selectedLead ? 'max-w-[60%]' : '')}>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 text-sm">Loading appointments...</div>
          ) : viewMode === 'calendar' ? (
            <div className="space-y-3">
              {/* Week navigation */}
              <div className="flex items-center justify-between bg-[#111113] border border-gray-800 rounded-lg p-3">
                <button
                  onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
                  className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-white">
                  {format(currentWeekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
                </span>
                <button
                  onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
                  className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-[10px] text-gray-500 uppercase tracking-wider py-2">
                    {day}
                  </div>
                ))}
                {days.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const dayAppts = appointmentsByDay[dayKey] || []
                  const isTodayDate = isToday(day)
                  return (
                    <div
                      key={dayKey}
                      className={cn(
                        'bg-[#111113] border rounded-lg p-2 min-h-[100px]',
                        isTodayDate ? 'border-emerald-500/30' : 'border-gray-800'
                      )}
                    >
                      <div className={cn(
                        'text-xs font-medium mb-1',
                        isTodayDate ? 'text-emerald-400' : 'text-gray-400'
                      )}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayAppts.slice(0, 3).map(apt => (
                          <div
                            key={apt.id}
                            onClick={() => {
                              setSelectedLead(apt)
                              setConversationsLeadId(apt.id)
                            }}
                            className="text-[10px] bg-gray-800/60 rounded px-1.5 py-0.5 cursor-pointer hover:bg-gray-700/60 transition-colors truncate"
                            style={{ borderLeft: `2px solid ${TIER_CONFIG[apt.priority_tier].color}` }}
                          >
                            {apt.display_name || apt.username}
                          </div>
                        ))}
                        {dayAppts.length > 3 && (
                          <div className="text-[9px] text-gray-600">+{dayAppts.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {(appointments || []).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No appointments yet</p>
                </div>
              ) : (
                (appointments || []).map((apt) => (
                  <div
                    key={apt.id}
                    className={cn(
                      'bg-[#111113] border rounded-lg p-4 hover:border-gray-600 transition-all cursor-pointer',
                      selectedLead?.id === apt.id && 'ring-1 ring-emerald-500/50'
                    )}
                    style={{ borderLeftWidth: '3px', borderLeftColor: TIER_CONFIG[apt.priority_tier].color }}
                    onClick={() => {
                      setSelectedLead(apt)
                      setConversationsLeadId(apt.id)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: TIER_CONFIG[apt.priority_tier].bgColor, color: TIER_CONFIG[apt.priority_tier].color }}
                        >
                          {(apt.display_name || apt.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{apt.display_name || apt.username}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <PlatformBadge platform={apt.platform} size="sm" showLabel={false} />
                            <TierBadge tier={apt.priority_tier} size="sm" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-300">{apt.appointment_date ? formatDate(apt.appointment_date) : '—'}</p>
                        <div className="mt-1">{getStatusBadge(apt.appointment_status)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedLead && (
          <div className="w-[40%] min-w-[300px] bg-[#111113] border border-gray-800 rounded-xl p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Appointment Details</h3>
              <button onClick={() => setSelectedLead(null)} className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: TIER_CONFIG[selectedLead.priority_tier].bgColor, color: TIER_CONFIG[selectedLead.priority_tier].color }}
              >
                {(selectedLead.display_name || selectedLead.username).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold text-white">{selectedLead.display_name || selectedLead.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <PlatformBadge platform={selectedLead.platform} size="sm" />
                  <TierBadge tier={selectedLead.priority_tier} size="sm" />
                </div>
              </div>
            </div>

            {/* Appointment Info */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Date & Time</label>
                <p className="text-sm text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {selectedLead.appointment_date ? formatFullDate(selectedLead.appointment_date) : 'Not scheduled'}
                </p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Status</label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedLead.appointment_status)}
                  <select
                    value={selectedLead.appointment_status || ''}
                    onChange={(e) => {
                      updateAppointment.mutate({ id: selectedLead.id, status: e.target.value as AppointmentStatus })
                      setSelectedLead({ ...selectedLead, appointment_status: e.target.value as AppointmentStatus })
                    }}
                    className="bg-gray-900 border border-gray-800 rounded-md px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            <ContactExtractor lead={selectedLead} />

            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Conversation</label>
              <ConversationThread conversations={conversations || []} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
