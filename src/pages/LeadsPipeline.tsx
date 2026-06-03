import { useState, useMemo } from 'react'
import { useLeads, useUpdateLead, usePipelineCounts } from '@/hooks/useLeads'
import { useConversations } from '@/hooks/useConversations'
import LeadCard from '@/components/LeadCard'
import TierBadge from '@/components/TierBadge'
import PlatformBadge from '@/components/PlatformBadge'
import ConversationThread from '@/components/ConversationThread'
import ContactExtractor from '@/components/ContactExtractor'
import { PIPELINE_STAGES, TIER_CONFIG, type QualifiedLead, type PipelineStage, type Tier } from '@/lib/types'
import { cn, truncate } from '@/lib/utils'
import { Users, Search, Filter, X, ChevronDown, MessageSquare, Phone, User } from 'lucide-react'

export default function LeadsPipeline() {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<QualifiedLead | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  const { data: leads, isLoading } = useLeads({
    tier: tierFilter !== 'all' ? (tierFilter as Tier) : undefined,
    platform: platformFilter !== 'all' ? platformFilter : undefined,
    search: search || undefined,
  })

  const updateLead = useUpdateLead()
  const { data: conversations } = useConversations(selectedLead?.id)

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, QualifiedLead[]> = {}
    PIPELINE_STAGES.forEach(s => grouped[s.key] = [])
    ;(leads || []).forEach(lead => {
      if (grouped[lead.pipeline_stage]) {
        grouped[lead.pipeline_stage].push(lead)
      }
    })
    return grouped
  }, [leads])

  const handleStageChange = (leadId: string, newStage: PipelineStage) => {
    updateLead.mutate({ id: leadId, updates: { pipeline_stage: newStage } })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Leads Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">{leads?.length || 0} qualified leads</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-0.5 border border-gray-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn('px-3 py-1 text-xs rounded-md transition-colors', viewMode === 'kanban' ? 'bg-gray-800 text-white' : 'text-gray-500')}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('px-3 py-1 text-xs rounded-md transition-colors', viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name/username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        >
          <option value="all">All Tiers</option>
          <option value="tier1">Tier 1 (Hot)</option>
          <option value="tier2">Tier 2 (Warm)</option>
          <option value="tier3">Tier 3 (Nurture)</option>
        </select>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        >
          <option value="all">All Platforms</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="tiktok">TikTok</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Pipeline / List */}
        <div className={cn('flex-1', selectedLead ? 'max-w-[60%]' : '')}>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 text-sm">Loading leads...</div>
          ) : viewMode === 'kanban' ? (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {PIPELINE_STAGES.map((stage) => (
                <div key={stage.key} className="min-w-[240px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <h3 className="text-xs font-semibold text-gray-300">{stage.label}</h3>
                    </div>
                    <span className="text-[10px] text-gray-600 bg-gray-800 rounded-full px-1.5 py-0.5">
                      {leadsByStage[stage.key]?.length || 0}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {(leadsByStage[stage.key] || []).map((lead) => (
                      <div
                        key={lead.id}
                        className={cn(
                          'cursor-pointer',
                          selectedLead?.id === lead.id && 'ring-1 ring-emerald-500/50 rounded-lg'
                        )}
                        onClick={() => setSelectedLead(lead)}
                      >
                        <LeadCard lead={lead} compact />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
              {(leads || []).map((lead) => (
                <div
                  key={lead.id}
                  className={cn(
                    'bg-[#111113] border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-all cursor-pointer',
                    selectedLead?.id === lead.id && 'ring-1 ring-emerald-500/50'
                  )}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: TIER_CONFIG[lead.priority_tier].bgColor,
                        color: TIER_CONFIG[lead.priority_tier].color,
                      }}
                    >
                      {(lead.display_name || lead.username).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {lead.display_name || lead.username}
                        </span>
                        <span className="text-xs text-gray-500">@{lead.username}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <PlatformBadge platform={lead.platform} size="sm" showLabel={false} />
                        <TierBadge tier={lead.priority_tier} size="sm" />
                        <span className="text-[10px] text-gray-600">Score: {lead.qualification_score}</span>
                      </div>
                    </div>
                    <select
                      value={lead.pipeline_stage}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStageChange(lead.id, e.target.value as PipelineStage)}
                      className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lead Detail Panel */}
        {selectedLead && (
          <div className="w-[40%] min-w-[300px] bg-[#111113] border border-gray-800 rounded-xl p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Lead Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lead info */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{
                  backgroundColor: TIER_CONFIG[selectedLead.priority_tier].bgColor,
                  color: TIER_CONFIG[selectedLead.priority_tier].color,
                }}
              >
                {(selectedLead.display_name || selectedLead.username).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold text-white">{selectedLead.display_name || selectedLead.username}</p>
                <p className="text-xs text-gray-500">@{selectedLead.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <PlatformBadge platform={selectedLead.platform} size="sm" />
                  <TierBadge tier={selectedLead.priority_tier} size="sm" />
                </div>
              </div>
            </div>

            {/* Stage dropdown */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Pipeline Stage</label>
              <select
                value={selectedLead.pipeline_stage}
                onChange={(e) => {
                  handleStageChange(selectedLead.id, e.target.value as PipelineStage)
                  setSelectedLead({ ...selectedLead, pipeline_stage: e.target.value as PipelineStage })
                }}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Score */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Qualification Score</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedLead.qualification_score}%`,
                      backgroundColor: TIER_CONFIG[selectedLead.priority_tier].color,
                    }}
                  />
                </div>
                <span className="text-sm font-bold" style={{ color: TIER_CONFIG[selectedLead.priority_tier].color }}>
                  {selectedLead.qualification_score}
                </span>
              </div>
            </div>

            {/* Intent signals */}
            {selectedLead.intent_signals && selectedLead.intent_signals.length > 0 && (
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Intent Signals</label>
                <div className="flex flex-wrap gap-1">
                  {selectedLead.intent_signals.map((signal, i) => (
                    <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-400 rounded px-1.5 py-0.5">{signal}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Contact Information</label>
              <ContactExtractor lead={selectedLead} />
            </div>

            {/* Conversation */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Conversation</label>
              <ConversationThread conversations={conversations || []} />
            </div>

            {/* Notes */}
            {selectedLead.notes && (
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Notes</label>
                <p className="text-xs text-gray-400 bg-gray-900/50 rounded-lg p-3">{selectedLead.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
