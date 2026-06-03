import type { QualifiedLead } from '@/lib/types'
import { TIER_CONFIG, PLATFORM_CONFIG } from '@/lib/types'
import { cn, truncate, formatPhoneNumber, timeAgo } from '@/lib/utils'
import TierBadge from './TierBadge'
import PlatformBadge from './PlatformBadge'
import { Phone, Mail, MessageSquare, ArrowRight } from 'lucide-react'

interface LeadCardProps {
  lead: QualifiedLead
  onSelect?: (lead: QualifiedLead) => void
  compact?: boolean
}

export default function LeadCard({ lead, onSelect, compact = false }: LeadCardProps) {
  const tierConfig = TIER_CONFIG[lead.priority_tier]

  return (
    <div
      className={cn(
        'bg-[#111113] border rounded-lg p-4 hover:border-gray-600 transition-all cursor-pointer animate-slide-in',
        compact ? 'p-3' : 'p-4'
      )}
      style={{ borderLeftWidth: '3px', borderLeftColor: tierConfig.color }}
      onClick={() => onSelect?.(lead)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: tierConfig.bgColor, color: tierConfig.color }}
          >
            {(lead.display_name || lead.username).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {lead.display_name || lead.username}
            </p>
            <p className="text-xs text-gray-500 truncate">@{lead.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <TierBadge tier={lead.priority_tier} size="sm" />
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500">Qualification Score</span>
          <span className="text-[10px] font-bold" style={{ color: tierConfig.color }}>
            {lead.qualification_score}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${lead.qualification_score}%`,
              backgroundColor: tierConfig.color,
            }}
          />
        </div>
      </div>

      {/* Contact info */}
      {(lead.phone || lead.email || lead.whatsapp) && (
        <div className="flex items-center gap-2 mb-2">
          {lead.phone && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-800/60 rounded px-1.5 py-0.5">
              <Phone className="w-2.5 h-2.5" />
              {formatPhoneNumber(lead.phone)}
            </span>
          )}
          {lead.email && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-800/60 rounded px-1.5 py-0.5">
              <Mail className="w-2.5 h-2.5" />
              {truncate(lead.email, 20)}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={lead.platform} size="sm" showLabel={false} />
          {lead.dm_count > 0 && (
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
              <MessageSquare className="w-2.5 h-2.5" /> {lead.dm_count}
            </span>
          )}
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
      </div>
    </div>
  )
}
