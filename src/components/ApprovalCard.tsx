import type { MessageQueue } from '@/lib/types'
import { cn, truncate, timeAgo, getConfidenceLabel } from '@/lib/utils'
import TierBadge from './TierBadge'
import PlatformBadge from './PlatformBadge'
import { Check, X, Pencil, User, Clock, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface ApprovalCardProps {
  message: MessageQueue
  leadInfo?: { username: string; display_name: string | null; priority_tier: string; platform: string; qualification_score: number; profile_pic_url: string | null } | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit: (id: string, newText: string) => void
  isProcessing?: boolean
}

export default function ApprovalCard({ message, leadInfo, onApprove, onReject, onEdit, isProcessing }: ApprovalCardProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.message_text)
  const confidence = getConfidenceLabel((message as any).ai_confidence || 0.5)

  const handleEditSave = () => {
    onEdit(message.id, editText)
    setEditing(false)
  }

  const handleEditCancel = () => {
    setEditText(message.message_text)
    setEditing(false)
  }

  return (
    <div className="bg-[#111113] border border-gray-800 rounded-lg p-4 animate-slide-in hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300">
            {(leadInfo?.display_name || leadInfo?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {leadInfo?.display_name || leadInfo?.username || 'Unknown Lead'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {leadInfo?.platform && <PlatformBadge platform={leadInfo.platform as any} size="sm" showLabel={false} />}
              <TierBadge tier={(message.tier || 'tier3') as any} size="sm" />
              {leadInfo?.qualification_score && (
                <span className="text-[10px] text-gray-500">Score: {leadInfo.qualification_score}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" style={{ color: confidence.color }} />
          <span className="text-[10px] font-medium" style={{ color: confidence.color }}>
            {confidence.label} ({Math.round(((message as any).ai_confidence || 0.5) * 100)}%)
          </span>
        </div>
      </div>

      {/* Message */}
      <div className="mb-3">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-emerald-500/50"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditSave}
                className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-300 leading-relaxed">{message.message_text}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo(message.created_at)}
          </span>
        </div>
        {!editing && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Edit message"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onReject(message.id)}
              disabled={isProcessing}
              className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              title="Reject"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onApprove(message.id)}
              disabled={isProcessing}
              className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
              title="Approve"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
