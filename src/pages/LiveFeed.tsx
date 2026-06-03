import { useLiveFeed } from '@/hooks/useLiveFeed'
import { cn, timeAgo, truncate } from '@/lib/utils'
import PlatformBadge from '@/components/PlatformBadge'
import { Activity, RefreshCw, User, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import type { RawCommenter } from '@/lib/types'

export default function LiveFeed() {
  const { data: commenters, isLoading, refetch, isRefetching } = useLiveFeed(100)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')

  const filtered = selectedPlatform === 'all'
    ? commenters || []
    : (commenters || []).filter((c: RawCommenter) => c.platform === selectedPlatform)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Live Feed
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time stream of scraped commenters from competitor pages</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-0.5 border border-gray-800">
            {['all', 'instagram', 'facebook'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={cn(
                  'px-3 py-1 text-xs rounded-md transition-colors capitalize',
                  selectedPlatform === p
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isRefetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{filtered.length} commenters</span>
        <span className="text-gray-700">·</span>
        <span>{filtered.filter(c => c.is_processed).length} processed</span>
        <span className="text-gray-700">·</span>
        <span>Auto-refreshes every 30s</span>
      </div>

      {/* Feed */}
      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading feed...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No commenters found yet</p>
            <p className="text-xs text-gray-600 mt-1">The Scout agent runs every 30 min and will populate this feed automatically.</p>
          </div>
        ) : (
          filtered.map((commenter: RawCommenter) => (
            <div
              key={commenter.id}
              className={cn(
                'bg-[#111113] border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-all',
                commenter.is_processed && 'border-l-2 border-l-emerald-500/50',
              )}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
                  {commenter.username.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">
                      {commenter.display_name || commenter.username}
                    </span>
                    <span className="text-xs text-gray-500">@{commenter.username}</span>
                    <PlatformBadge platform={commenter.platform} size="sm" showLabel={true} />
                    {commenter.is_processed && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 rounded px-1.5 py-0.5 ml-auto">Processed</span>
                    )}
                  </div>

                  {commenter.source_comment_text && (
                    <div className="flex items-start gap-1 mb-1.5">
                      <MessageSquare className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-300 leading-relaxed">{commenter.source_comment_text}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-gray-600">
                    {commenter.scraped_at && <span>{timeAgo(commenter.scraped_at)}</span>}
                    {commenter.source_competitor_username && (
                      <>
                        <span className="text-gray-800">·</span>
                        <span>From: @{commenter.source_competitor_username}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
