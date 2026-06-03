import { useState } from 'react'
import { useApprovalQueue, useUpdateMessageStatus, useBulkUpdateStatus, useEditMessage } from '@/hooks/useApprovalQueue'
import ApprovalCard from '@/components/ApprovalCard'
import { CheckSquare, XSquare, Filter, Inbox, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ApprovalStatus } from '@/lib/types'

export default function ApprovalQueue() {
  const { data: messages, isLoading } = useApprovalQueue()
  const updateStatus = useUpdateMessageStatus()
  const bulkUpdate = useBulkUpdateStatus()
  const editMessage = useEditMessage()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(0.9)
  const [filterTier, setFilterTier] = useState<string>('all')

  const filtered = filterTier === 'all'
    ? messages || []
    : (messages || []).filter((m) => m.tier === filterTier)

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(m => m.id)))
    }
  }

  const handleApprove = (id: string) => {
    updateStatus.mutate({ id, status: 'approved' as ApprovalStatus })
  }

  const handleReject = (id: string) => {
    updateStatus.mutate({ id, status: 'rejected' as ApprovalStatus })
  }

  const handleEdit = (id: string, newText: string) => {
    editMessage.mutate({ id, messageText: newText })
  }

  const handleBulkApprove = () => {
    if (selectedIds.size > 0) {
      bulkUpdate.mutate({ ids: Array.from(selectedIds), status: 'approved' as ApprovalStatus })
      setSelectedIds(new Set())
    }
  }

  const handleBulkReject = () => {
    if (selectedIds.size > 0) {
      bulkUpdate.mutate({ ids: Array.from(selectedIds), status: 'rejected' as ApprovalStatus })
      setSelectedIds(new Set())
    }
  }

  const handleAutoApprove = () => {
    const highConfidence = filtered.filter(m => (m as any).ai_confidence >= autoApproveThreshold)
    if (highConfidence.length > 0) {
      bulkUpdate.mutate({ ids: highConfidence.map(m => m.id), status: 'approved' as ApprovalStatus })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Approval Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} pending message{filtered.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-0.5 border border-gray-800">
            {['all', 'tier1', 'tier2', 'tier3'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterTier(t)}
                className={cn(
                  'px-3 py-1 text-xs rounded-md transition-colors capitalize',
                  filterTier === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {t === 'all' ? 'All Tiers' : t.replace('tier', 'Tier ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 bg-[#111113] border border-gray-800 rounded-lg p-3">
          <button
            onClick={selectAll}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
          </button>

          {selectedIds.size > 0 && (
            <>
              <span className="text-gray-700">·</span>
              <span className="text-xs text-gray-500">{selectedIds.size} selected</span>
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
              >
                Bulk Approve
              </button>
              <button
                onClick={handleBulkReject}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
              >
                Bulk Reject
              </button>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <button
              onClick={handleAutoApprove}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Auto-approve high confidence ({Math.round(autoApproveThreshold * 100)}%+)
            </button>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.05}
              value={autoApproveThreshold}
              onChange={(e) => setAutoApproveThreshold(parseFloat(e.target.value))}
              className="w-20 accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading approval queue...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No pending messages</p>
            <p className="text-gray-600 text-xs mt-1">New messages will appear here when the DM Sender agent creates them</p>
          </div>
        ) : (
          filtered.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(message.id)}
                onChange={() => toggleSelect(message.id)}
                className="mt-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="flex-1">
                <ApprovalCard
                  message={message}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                  isProcessing={updateStatus.isPending}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
