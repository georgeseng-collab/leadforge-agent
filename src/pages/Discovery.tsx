import { useState } from 'react'
import { useCompetitors } from '@/hooks/useCompetitors'
import { supabase } from '@/lib/supabase'
import {
  startInstagramDiscovery,
  startFacebookDiscovery,
  checkDiscoveryRun,
  parseInstagramResults,
  parseFacebookResults,
  SG_DISCOVERY_HASHTAGS,
} from '@/lib/discovery'
import type { DiscoveredFirm, DiscoveryRun } from '@/lib/discovery'
import {
  Search, RefreshCw, Camera, Globe, Plus, CheckCircle2, Loader2,
  Zap, ChevronDown, ChevronUp, ExternalLink, Sparkles, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import PlatformBadge from '@/components/PlatformBadge'

export default function Discovery() {
  const { data: competitors, refetch: refetchCompetitors } = useCompetitors()
  const [isDiscoveringIG, setIsDiscoveringIG] = useState(false)
  const [isDiscoveringFB, setIsDiscoveringFB] = useState(false)
  const [discoveredFirms, setDiscoveredFirms] = useState<DiscoveredFirm[]>([])
  const [logs, setLogs] = useState<Array<{ message: string; type: 'info' | 'success' | 'error' | 'warning' }>>([])
  const [activeRuns, setActiveRuns] = useState<DiscoveryRun[]>([])
  const [checkingRun, setCheckingRun] = useState<string | null>(null)
  const [minConfidence, setMinConfidence] = useState(30)
  const [addingFirms, setAddingFirms] = useState<Set<string>>(new Set())

  const existingUsernames = new Set((competitors || []).map(c => c.username.toLowerCase()))

  // Filter out already-added firms
  const newFirms = discoveredFirms.filter(
    f => !existingUsernames.has(f.username.toLowerCase()) && f.confidenceScore >= minConfidence
  )

  const addLog = (message: string, type: typeof logs[0]['type'] = 'info') => {
    setLogs(prev => [{ message, type }, ...prev].slice(0, 50))
  }

  const handleDiscoverIG = async () => {
    setIsDiscoveringIG(true)
    addLog('🔍 Starting Instagram hashtag discovery...')

    try {
      const run = await startInstagramDiscovery(
        SG_DISCOVERY_HASHTAGS.instagram.slice(0, 5),
        20
      )

      addLog(run.status === 'running'
        ? `✅ Instagram scraper started (Run: ${run.runId}) — searching 5 hashtags`
        : `⚠️ Failed to start Instagram scraper`
      )

      setActiveRuns(prev => [run, ...prev])

      // Poll for results
      if (run.runId && run.runId !== 'error') {
        pollForResults(run.runId, 'instagram')
      }
    } catch (error) {
      addLog(`❌ Instagram discovery failed: ${error instanceof Error ? error.message : 'Unknown'}`, 'error')
    } finally {
      setIsDiscoveringIG(false)
    }
  }

  const handleDiscoverFB = async () => {
    setIsDiscoveringFB(true)
    addLog('🔍 Starting Facebook page discovery...')

    try {
      const run = await startFacebookDiscovery(
        SG_DISCOVERY_HASHTAGS.facebook.slice(0, 5)
      )

      addLog(run.status === 'running'
        ? `✅ Facebook scraper started (Run: ${run.runId}) — searching 5 terms`
        : `⚠️ Failed to start Facebook scraper`
      )

      setActiveRuns(prev => [run, ...prev])

      if (run.runId && run.runId !== 'error') {
        pollForResults(run.runId, 'facebook')
      }
    } catch (error) {
      addLog(`❌ Facebook discovery failed: ${error instanceof Error ? error.message : 'Unknown'}`, 'error')
    } finally {
      setIsDiscoveringFB(false)
    }
  }

  const pollForResults = async (runId: string, platform: 'instagram' | 'facebook') => {
    let attempts = 0
    const maxAttempts = 30 // ~2.5 minutes

    const poll = async () => {
      attempts++
      setCheckingRun(runId)

      try {
        const result = await checkDiscoveryRun(runId)

        if (result.status === 'completed') {
          addLog(`✅ Scraping complete! Found ${result.itemCount} raw items`, 'success')

          // Parse results into discovered firms
          const parsed = platform === 'instagram'
            ? parseInstagramResults(result.items, 'hashtag_search')
            : parseFacebookResults(result.items, 'page_search')

          addLog(`🧠 AI filtered ${parsed.length} likely interior design firms from ${result.itemCount} results`, 'info')

          setDiscoveredFirms(prev => {
            const existing = new Set(prev.map(f => f.username.toLowerCase()))
            const newOnes = parsed.filter(f => !existing.has(f.username.toLowerCase()))
            return [...newOnes, ...prev]
          })

          setCheckingRun(null)
          return
        }

        if (result.status === 'failed' || result.status === 'error') {
          addLog(`❌ Scraping run failed`, 'error')
          setCheckingRun(null)
          return
        }

        // Still running
        if (attempts < maxAttempts) {
          addLog(`⏳ Scraping in progress... (attempt ${attempts}/${maxAttempts})`)
          setTimeout(poll, 5000)
        } else {
          addLog('⚠️ Scraping timeout — check Apify dashboard for results', 'warning')
          setCheckingRun(null)
        }
      } catch {
        setCheckingRun(null)
        addLog('❌ Error checking run status', 'error')
      }
    }

    poll()
  }

  const handleAddFirm = async (firm: DiscoveredFirm) => {
    setAddingFirms(prev => new Set(prev).add(firm.username))

    try {
      const { error } = await supabase
        .from('competitor_sources')
        .insert({
          platform: firm.platform,
          username: firm.username,
          display_name: firm.displayName,
          follower_count: firm.followerCount,
          avg_comments_per_post: null,
          last_scraped_at: null,
          is_active: true,
          discovery_method: 'auto_discovered',
          notes: `Auto-discovered via ${firm.sourceHashtag || 'hashtag search'}. Confidence: ${firm.confidenceScore}%`,
        })

      if (error && error.code !== '23505') {
        addLog(`❌ Failed to add @${firm.username}: ${error.message}`, 'error')
      } else {
        addLog(`✅ Added @${firm.username} to monitored competitors`, 'success')
        refetchCompetitors()
        // Remove from discovered list
        setDiscoveredFirms(prev => prev.filter(f => f.username !== firm.username))
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`, 'error')
    } finally {
      setAddingFirms(prev => {
        const next = new Set(prev)
        next.delete(firm.username)
        return next
      })
    }
  }

  const handleAddAll = async () => {
    const toAdd = newFirms.slice(0, 20) // Add top 20 at a time
    let added = 0

    for (const firm of toAdd) {
      try {
        const { error } = await supabase
          .from('competitor_sources')
          .insert({
            platform: firm.platform,
            username: firm.username,
            display_name: firm.displayName,
            follower_count: firm.followerCount,
            avg_comments_per_post: null,
            last_scraped_at: null,
            is_active: true,
            discovery_method: 'auto_discovered',
            notes: `Auto-discovered via ${firm.sourceHashtag || 'hashtag search'}. Confidence: ${firm.confidenceScore}%`,
          })

        if (!error || error.code === '23505') {
          added++
        }
      } catch {}
    }

    addLog(`✅ Added ${added} new firms from discovery`, 'success')
    refetchCompetitors()
    setDiscoveredFirms(prev => prev.filter(f => !toAdd.some(a => a.username === f.username)))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            Live Discovery
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI auto-discovers new SG interior design firms 24/7</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDiscoverIG}
            disabled={isDiscoveringIG}
            className="flex items-center gap-1.5 px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {isDiscoveringIG ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Discover IG
          </button>
          <button
            onClick={handleDiscoverFB}
            disabled={isDiscoveringFB}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {isDiscoveringFB ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Discover FB
          </button>
        </div>
      </div>

      {/* Discovery Status */}
      {checkingRun && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <div>
            <p className="text-sm font-medium text-blue-400">Scraping in progress...</p>
            <p className="text-xs text-gray-500">Apify is scraping social media for new firms. This may take 1-3 minutes.</p>
          </div>
        </div>
      )}

      {/* Hashtags being monitored */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Search Keywords ({SG_DISCOVERY_HASHTAGS.instagram.length} IG + {SG_DISCOVERY_HASHTAGS.facebook.length} FB)
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {SG_DISCOVERY_HASHTAGS.instagram.slice(0, 10).map(tag => (
            <span key={tag} className="text-[10px] bg-pink-500/10 text-pink-400 rounded px-2 py-1">#{tag}</span>
          ))}
          <span className="text-[10px] bg-gray-800 text-gray-400 rounded px-2 py-1">
            +{SG_DISCOVERY_HASHTAGS.instagram.length - 10} more
          </span>
          {SG_DISCOVERY_HASHTAGS.facebook.slice(0, 5).map(term => (
            <span key={term} className="text-[10px] bg-blue-500/10 text-blue-400 rounded px-2 py-1">{term}</span>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      {logs.length > 0 && (
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-white">Discovery Log</h2>
            <button onClick={() => setLogs([])} className="text-[10px] text-gray-600 hover:text-gray-400">Clear</button>
          </div>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {logs.map((log, i) => (
              <p key={i} className={cn(
                'text-[11px]',
                log.type === 'success' && 'text-emerald-400',
                log.type === 'error' && 'text-red-400',
                log.type === 'warning' && 'text-amber-400',
                log.type === 'info' && 'text-blue-400',
              )}>
                {log.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">Discovered Firms</h2>
          <span className="text-xs text-gray-500">{newFirms.length} new firms found</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500">Min confidence:</span>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseInt(e.target.value))}
              className="w-20 accent-emerald-500"
            />
            <span className="text-xs text-gray-400">{minConfidence}%</span>
          </div>
          {newFirms.length > 0 && (
            <button
              onClick={handleAddAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Top 20
            </button>
          )}
        </div>
      </div>

      {/* Discovered Firms List */}
      {newFirms.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No new firms discovered yet</p>
          <p className="text-gray-600 text-xs mt-1">Click "Discover IG" or "Discover FB" to start scanning social media</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
          {newFirms.map((firm) => (
            <div
              key={`${firm.platform}-${firm.username}`}
              className="bg-[#111113] border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                  firm.platform === 'instagram' ? 'bg-pink-500/15 text-pink-400' : 'bg-blue-500/15 text-blue-400'
                )}>
                  {firm.username.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{firm.displayName}</p>
                    <PlatformBadge platform={firm.platform} size="sm" />
                    {firm.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                  </div>
                  <p className="text-xs text-gray-500">@{firm.username}</p>
                  {firm.bio && (
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{firm.bio}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                    {firm.followerCount && (
                      <span>{firm.followerCount.toLocaleString()} followers</span>
                    )}
                    {firm.postCount && (
                      <span>{firm.postCount.toLocaleString()} posts</span>
                    )}
                    {firm.sourceHashtag && (
                      <span>via #{firm.sourceHashtag}</span>
                    )}
                  </div>
                </div>

                {/* Confidence + Add */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className={cn(
                      'text-xs font-bold',
                      firm.confidenceScore >= 70 ? 'text-emerald-400' :
                      firm.confidenceScore >= 50 ? 'text-amber-400' : 'text-gray-400'
                    )}>
                      {firm.confidenceScore}%
                    </div>
                    <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden mt-0.5">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          firm.confidenceScore >= 70 ? 'bg-emerald-500' :
                          firm.confidenceScore >= 50 ? 'bg-amber-500' : 'bg-gray-500'
                        )}
                        style={{ width: `${firm.confidenceScore}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFirm(firm)}
                    disabled={addingFirms.has(firm.username)}
                    className="p-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {addingFirms.has(firm.username) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
