import { useState, useEffect } from 'react'
import { useLeadStats, usePipelineCounts } from '@/hooks/useLeads'
import { useLatestAgentRuns, useAgentStatus } from '@/hooks/useAgentRuns'
import { useTopKeywords } from '@/hooks/useKeywords'
import { useCompetitors } from '@/hooks/useCompetitors'
import { useN8nWorkflows, useN8nExecutions } from '@/hooks/useN8n'
import { useQuery } from '@tanstack/react-query'
import StatCard from '@/components/StatCard'
import AgentStatusIndicator from '@/components/AgentStatusIndicator'
import { kickStartAgent, followChannel, followChannels, getWorkflowConfigs, getWorkflowNameById, WORKFLOWS } from '@/lib/n8n'
import { supabase } from '@/lib/supabase'
import { Users, Flame, Calendar, TrendingUp, Zap, Search, Bot, MessageSquare, Phone, Rocket, Camera, Globe, Activity, AlertCircle, CheckCircle2, Loader2, ExternalLink, Clock, XCircle, Play, RotateCw, Send, Mail, MailCheck, MailX } from 'lucide-react'
import { AGENT_TYPE_CONFIG } from '@/lib/types'
import type { AgentType } from '@/lib/types'
import { timeAgo, cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { SG_DESIGN_FIRMS } from '@/data/sg-design-firms'
import type { MessageQueue, CompetitorSource } from '@/lib/types'

// ===== Live Source Feed Sub-Component =====
function LiveSourceFeed() {
  const { data: commenters, isLoading, refetch } = useQuery({
    queryKey: ['live-source-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_commenters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15)
      if (error) throw error
      return data || []
    },
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
        <span className="ml-2 text-xs text-gray-500">Loading live feed...</span>
      </div>
    )
  }

  if (!commenters || commenters.length === 0) {
    return (
      <div className="text-center py-6">
        <Search className="w-8 h-8 text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-500">No scraped commenters yet</p>
        <p className="text-[10px] text-gray-600 mt-1">
          The Scout Agent scrapes competitor posts every 30 minutes. Commenters will appear here once found.
        </p>
        <button
          onClick={() => refetch()}
          className="text-[10px] text-emerald-400 hover:text-emerald-300 mt-2"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {commenters.map((c: any) => (
        <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-900/30 border border-gray-800/30">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
            c.platform === 'instagram' ? 'bg-pink-500/15' : 'bg-blue-500/15',
          )}>
            {c.platform === 'instagram' ? (
              <Camera className="w-3.5 h-3.5 text-pink-400" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white">
              <span className="font-medium">@{c.username}</span>
              <span className="text-gray-500"> commented</span>
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              {c.source_comment_text ? c.source_comment_text.substring(0, 100) : 'No text'}
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className={cn(
              'text-[9px] px-1.5 py-0.5 rounded font-medium',
              c.processed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400',
            )}>
              {c.processed ? 'processed' : 'new'}
            </span>
            {c.created_at && (
              <span className="text-[10px] text-gray-600 mt-0.5">{timeAgo(c.created_at)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ===== Follow Channel Tracker Sub-Component =====
function FollowChannelTracker() {
  const { data: competitors, isLoading, refetch } = useQuery({
    queryKey: ['follow-tracker-competitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitor_sources')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return (data || []) as CompetitorSource[]
    },
    refetchInterval: 30000,
  })

  const [followingUsername, setFollowingUsername] = useState<string | null>(null)

  const handleFollowOne = async (username: string, platform: string) => {
    setFollowingUsername(username)
    try {
      await followChannel({ username, platform })
    } catch {
      // ignore
    }
    await new Promise(r => setTimeout(r, 1500))
    refetch()
    setFollowingUsername(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
        <span className="ml-2 text-xs text-gray-500">Loading channels...</span>
      </div>
    )
  }

  if (!competitors || competitors.length === 0) {
    return (
      <div className="text-center py-6">
        <Camera className="w-8 h-8 text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-500">No competitor channels yet</p>
        <p className="text-[10px] text-gray-600 mt-1">Click "Follow Channels" above to add and follow competitors.</p>
      </div>
    )
  }

  const followed = competitors.filter(c => c.last_scraped_at != null).length
  const notFollowed = competitors.filter(c => c.last_scraped_at == null)

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-3 p-2 rounded-lg bg-gray-900/40">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400">{followed} followed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-amber-400">{notFollowed.length} pending</span>
        </div>
        <div className="flex-1" />
        <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${competitors.length > 0 ? (followed / competitors.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {competitors.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-900/20 hover:bg-gray-900/40 transition-colors">
            <div className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
              c.platform === 'instagram' ? 'bg-pink-500/10' : 'bg-blue-500/10',
            )}>
              {c.platform === 'instagram' ? (
                <Camera className="w-3 h-3 text-pink-400" />
              ) : (
                <Globe className="w-3 h-3 text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">
                {c.display_name || c.username}
                <span className="text-gray-500 ml-1">@{c.username}</span>
              </p>
              {c.follower_count && (
                <p className="text-[10px] text-gray-500">{c.follower_count.toLocaleString()} followers</p>
              )}
            </div>
            <div className="shrink-0">
              {c.last_scraped_at != null ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                  followed
                </span>
              ) : (
                <button
                  onClick={() => handleFollowOne(c.username, c.platform)}
                  disabled={followingUsername === c.username}
                  className="text-[9px] px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 font-medium transition-colors disabled:opacity-50"
                >
                  {followingUsername === c.username ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      following
                    </span>
                  ) : (
                    '+ Follow'
                  )}
                </button>
              )}
            </div>
            {c.last_scraped_at && (
              <span className="text-[9px] text-gray-600 shrink-0">
                scraped {timeAgo(c.last_scraped_at)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface ActivityLog {
  id: string
  timestamp: Date
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useLeadStats()
  const { data: pipelineCounts, isLoading: pipelineLoading } = usePipelineCounts()
  const { data: latestRuns } = useLatestAgentRuns()
  const { data: agentStatuses } = useAgentStatus()
  const { data: topKeywords } = useTopKeywords(10)
  const { data: competitors, refetch: refetchCompetitors } = useCompetitors()
  const { data: n8nWorkflows, isLoading: n8nWfLoading } = useN8nWorkflows()
  const { data: n8nExecutions, isLoading: n8nExLoading, refetch: refetchExecutions } = useN8nExecutions(15)

  const [isKicking, setIsKicking] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [kickResult, setKickResult] = useState<string | null>(null)

  // DM Outbox - query message_queue to see DM sending status
  const { data: dmMessages, isLoading: dmLoading, refetch: refetchDms } = useQuery({
    queryKey: ['dm-outbox'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data || []) as MessageQueue[]
    },
    refetchInterval: 15000,
  })

  const dmSent = (dmMessages || []).filter(m => m.send_status === 'sent').length
  const dmPending = (dmMessages || []).filter(m => m.approval_status === 'pending').length
  const dmQueued = (dmMessages || []).filter(m => m.send_status === 'queued').length

  const addLog = (type: ActivityLog['type'], message: string) => {
    setActivityLog(prev => [{
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type,
      message,
    }, ...prev].slice(0, 50))
  }

  const handleKickStart = async () => {
    setIsKicking(true)
    setKickResult(null)
    addLog('info', 'Kick Start Agent triggered...')

    try {
      // Step 1: Auto-add all competitor channels to Supabase first
      addLog('info', 'Checking competitor channels...')
      const existingUsernames = new Set((competitors || []).map(c => c.username.toLowerCase()))
      const toAdd = SG_DESIGN_FIRMS.filter(f => !existingUsernames.has(f.username.toLowerCase()))

      if (toAdd.length > 0) {
        addLog('info', `Adding ${toAdd.length} competitor channels to database...`)
        let added = 0
        let failed = 0

        for (const firm of toAdd) {
          try {
            const { error } = await supabase
              .from('competitor_sources')
              .insert({
                platform: firm.platform,
                platform_id: firm.username,
                username: firm.username,
                display_name: firm.displayName,
                is_active: true,
                discovery_method: 'auto_discovered',
                discovery_source: 'dashboard_import',
                priority_score: 0.5,
              })
            if (error && error.code !== '23505') { // skip duplicates
              failed++
              addLog('error', `Failed: @${firm.username} — ${error.message}`)
            } else {
              added++
            }
          } catch {
            failed++
          }
        }
        addLog('success', `Added ${added} channels to database${failed > 0 ? ` (${failed} failed)` : ''}`)
        refetchCompetitors()
      } else {
        addLog('success', 'All competitor channels already in database!')
      }

      // Step 1b: Trigger Follow Channel webhook — new channels first, then any existing unscraped ones
      const unscraped = (competitors || []).filter(c => c.last_scraped_at == null)
      const channelsToFollow = toAdd.length > 0
        ? [...toAdd, ...unscraped.filter(c => !toAdd.find(f => f.username.toLowerCase() === c.username.toLowerCase()))]
        : unscraped
      const followBatch = channelsToFollow.slice(0, 15)
      if (followBatch.length > 0) {
        addLog('info', `Triggering Follow Channel for ${followBatch.length} channels...`)
        let followSuccess = 0
        let followFail = 0
        for (const ch of followBatch) {
          try {
            const result = await followChannel({ username: ch.username, platform: ch.platform })
            if (result?.success) followSuccess++
            else followFail++
          } catch {
            followFail++
          }
          await new Promise(r => setTimeout(r, 800))
        }
        if (followSuccess > 0) addLog('success', `Follow Channel triggered for ${followSuccess} channels.`)
        if (followFail > 0) addLog('warning', `${followFail} channels failed to trigger Follow Channel webhook`)
      } else {
        addLog('info', 'All channels already followed — skipping Follow Channel step.')
      }

      // Step 2: Trigger n8n workflows (via webhooks for webhook-based, confirm schedule for others)
      addLog('info', 'Triggering n8n workflows...')
      try {
        const result = await kickStartAgent({
          platforms: ['instagram', 'facebook'],
          competitorLimit: 20,
          maxComments: 100,
        })

        if (result.discovery) {
          addLog('success', `Discovery Agent: running now — scraping Instagram & Facebook for new competitors`)
        }
        if (result.scout) {
          addLog('success', `Scout Agent: ${result.scout.message}`)
        }
        if (result.qualifier) {
          addLog('success', `Qualifier Agent: ${result.qualifier.message}`)
        }
        if (result.followChannel) {
          addLog('success', `Follow Channel Agent: ${result.followChannel.message}`)
        }
        addLog('info', 'All scheduled agents activated — DM Sender & Follow-Up will run on their schedules.')

        // Log any errors from n8n
        for (const err of result.errors) {
          if (err.includes('timed out')) {
            addLog('warning', `n8n timeout: ${err}. Workflows may still be running — check n8n Monitor.`)
          } else {
            addLog('warning', `n8n: ${err}`)
          }
        }

        if (!result.scout && !result.qualifier && !result.followChannel && result.errors.length > 0) {
          addLog('warning', 'n8n workflows not reachable. Check n8n Monitor page for details.')
        }
      } catch (error: any) {
        const msg = error?.message || 'Unknown'
        if (msg.includes('timed out')) {
          addLog('warning', 'n8n Cloud timed out — it may be waking up. Try again in 30s. Channels are saved locally.')
        } else {
          addLog('warning', `n8n trigger failed: ${msg}. Channels added locally.`)
        }
      }

      // Step 3: Record agent run in Supabase
      try {
        await supabase.from('agent_runs').insert({
          agent_type: 'scout',
          status: 'running',
          items_processed: toAdd.length,
          items_failed: 0,
          input_summary: `Kick Start: ${toAdd.length} channels added`,
          output_summary: 'Triggered Discovery + Scout + Qualifier + Follow Channel + DM Sender + Follow-Up workflows',
          started_at: new Date().toISOString(),
        })
      } catch {
        // Non-critical
      }

      setKickResult('success')
      addLog('success', 'Kick Start complete! Workflows triggered. Check executions below.')

      // Refresh executions after a brief delay
      setTimeout(() => refetchExecutions(), 3000)
    } catch (error) {
      addLog('error', `Kick Start failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setKickResult('error')
    } finally {
      setIsKicking(false)
    }
  }

  const handleFollowChannels = async () => {
    setIsFollowing(true)
    addLog('info', 'Following & adding competitor channels...')

    try {
      // Step 1: Add to Supabase
      const existingUsernames = new Set((competitors || []).map(c => c.username.toLowerCase()))
      const toFollow = SG_DESIGN_FIRMS.filter(
        f => !existingUsernames.has(f.username.toLowerCase())
      )

      if (toFollow.length === 0) {
        addLog('info', 'All competitor channels already in database. Triggering Follow Channel workflow...')
      } else {
        const igCount = toFollow.filter(f => f.platform === 'instagram').length
        const fbCount = toFollow.filter(f => f.platform === 'facebook').length
        addLog('info', `Found ${toFollow.length} channels to add (${igCount} IG, ${fbCount} FB)`)

        let added = 0
        let failed = 0

        for (const firm of toFollow) {
          try {
            const { error } = await supabase
              .from('competitor_sources')
              .insert({
                platform: firm.platform,
                platform_id: firm.username,
                username: firm.username,
                display_name: firm.displayName,
                is_active: true,
                discovery_method: 'auto_discovered',
                discovery_source: 'dashboard_follow',
                priority_score: 0.5,
              })
            if (error && error.code !== '23505') {
              failed++
              addLog('error', `Failed: @${firm.username} — ${error.message}`)
            } else {
              added++
            }
          } catch {
            failed++
          }

          if (added > 0 && added % 10 === 0) {
            await new Promise(r => setTimeout(r, 100))
          }
        }

        addLog('success', `Added ${added} channels${failed > 0 ? ` (${failed} failed)` : ''}`)
        refetchCompetitors()
      }

      // Step 2: Trigger n8n Follow Channel webhook per channel
      // The n8n workflow expects { username, platform } and will fetch IG/FB profile data
      addLog('info', 'Triggering Follow Channel webhook for each channel...')
      const channelsToFollow = toFollow.length > 0 ? toFollow : (competitors || []).filter(c => c.last_scraped_at == null)
      let followOk = 0
      let followErr = 0
      for (const ch of channelsToFollow.slice(0, 15)) { // Process up to 15 at a time
        try {
          const result = await followChannel({ username: ch.username, platform: ch.platform })
          if (result?.success) followOk++
          else followErr++
        } catch {
          followErr++
        }
        await new Promise(r => setTimeout(r, 800)) // Rate limit between calls
      }
      if (followOk > 0) addLog('success', `Follow Channel triggered for ${followOk} channels. n8n will fetch profile data & follow them.`)
      if (followErr > 0) addLog('warning', `${followErr} channels failed to trigger`)

      // Refresh executions after a brief delay
      setTimeout(() => refetchExecutions(), 3000)
    } catch (error) {
      addLog('error', `Follow channels failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFollowing(false)
    }
  }

  const pipelineData = pipelineCounts
    ? [
        { name: 'New', value: pipelineCounts['new'] || 0, color: '#6b7280' },
        { name: 'Contacted', value: pipelineCounts['contacted'] || 0, color: '#3b82f6' },
        { name: 'Responded', value: pipelineCounts['responded'] || 0, color: '#8b5cf6' },
        { name: 'Appt Set', value: pipelineCounts['appointment_set'] || 0, color: '#f59e0b' },
        { name: 'Won', value: pipelineCounts['closed_won'] || 0, color: '#10b981' },
        { name: 'Lost', value: pipelineCounts['closed_lost'] || 0, color: '#ef4444' },
      ]
    : []

  // Count followed channels (last_scraped_at != null means n8n has followed them and marked them)
  const igFollowed = (competitors || []).filter(c => c.platform === 'instagram' && c.last_scraped_at != null).length
  const fbFollowed = (competitors || []).filter(c => c.platform === 'facebook' && c.last_scraped_at != null).length
  // Use live Supabase count so totals grow dynamically as Discovery Agent finds new competitors
  const igTotal = Math.max((competitors || []).filter(c => c.platform === 'instagram').length, SG_DESIGN_FIRMS.filter(f => f.platform === 'instagram').length)
  const fbTotal = Math.max((competitors || []).filter(c => c.platform === 'facebook').length, SG_DESIGN_FIRMS.filter(f => f.platform === 'facebook').length)

  const activeWorkflows = (n8nWorkflows || []).filter(w => w.active).length
  const totalWorkflows = (n8nWorkflows || []).length

  const getN8nStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      case 'error': return <XCircle className="w-3 h-3 text-red-400" />
      case 'running': return <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
      case 'waiting': return <Clock className="w-3 h-3 text-amber-400" />
      case 'unknown': return <AlertCircle className="w-3 h-3 text-gray-500" />
      default: return <Clock className="w-3 h-3 text-gray-500" />
    }
  }

  // Map execution workflowId to a friendly name
  const getExecWorkflowName = (workflowId: string, workflowDataName?: string) => {
    if (workflowDataName) return workflowDataName
    return getWorkflowNameById(workflowId)
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Kick Start */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">24/7 autonomous lead generation for Singapore interior design</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleKickStart}
            disabled={isKicking}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all',
              isKicking
                ? 'bg-emerald-600/20 text-emerald-400 cursor-wait'
                : kickResult === 'success'
                ? 'bg-emerald-600 text-white'
                : kickResult === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
            )}
          >
            {isKicking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            {isKicking ? 'Starting...' : kickResult === 'success' ? 'Agent Running!' : 'Kick Start Agent'}
          </button>
        </div>
      </div>

      {/* Channel Follow Status + n8n Status */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#111113] border border-gray-800 rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-500/15 flex items-center justify-center">
            <Camera className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Instagram Channels</p>
            <p className="text-sm font-medium text-white">
              {igFollowed}/{igTotal} followed
            </p>
          </div>
          <div className="ml-auto">
            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-pink-500 transition-all"
                style={{ width: `${igTotal > 0 ? (igFollowed / igTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-[#111113] border border-gray-800 rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Facebook Pages</p>
            <p className="text-sm font-medium text-white">
              {fbFollowed}/{fbTotal} followed
            </p>
          </div>
          <div className="ml-auto">
            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${fbTotal > 0 ? (fbFollowed / fbTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        <a
          href="https://leadforge.app.n8n.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#111113] border border-gray-800 rounded-lg p-3 flex items-center gap-3 hover:border-gray-600 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">n8n Workflows</p>
            <p className="text-sm font-medium text-white">
              {n8nWfLoading ? '...' : `${activeWorkflows}/${totalWorkflows} active`}
            </p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-600 ml-auto" />
        </a>
      </div>

      {/* Activity Log (Real-time Feedback) */}
      {activityLog.length > 0 && (
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Agent Activity
            </h2>
            <button
              onClick={() => setActivityLog([])}
              className="text-[10px] text-gray-600 hover:text-gray-400"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {activityLog.map((log) => (
              <div
                key={log.id}
                className={cn(
                  'flex items-start gap-2 py-1.5 px-2 rounded text-xs',
                  log.type === 'success' && 'text-emerald-400',
                  log.type === 'error' && 'text-red-400',
                  log.type === 'warning' && 'text-amber-400',
                  log.type === 'info' && 'text-blue-400',
                )}
              >
                <span className="text-[10px] text-gray-600 shrink-0 mt-0.5">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={statsLoading ? '...' : (stats?.totalLeads || 0)}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="rgba(59, 130, 246, 0.15)"
        />
        <StatCard
          label="Tier 1 (Hot)"
          value={statsLoading ? '...' : (stats?.tier1Count || 0)}
          icon={Flame}
          iconColor="#ef4444"
          iconBgColor="rgba(239, 68, 68, 0.15)"
        />
        <StatCard
          label="Appointments Today"
          value={statsLoading ? '...' : (stats?.appointmentsToday || 0)}
          icon={Calendar}
          iconColor="#f59e0b"
          iconBgColor="rgba(245, 158, 11, 0.15)"
        />
        <StatCard
          label="Conversion Rate"
          value={statsLoading ? '...' : `${stats?.conversionRate || 0}%`}
          icon={TrendingUp}
          iconColor="#10b981"
          iconBgColor="rgba(16, 185, 129, 0.15)"
        />
      </div>

      {/* Middle row: Pipeline + Agent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Funnel */}
        <div className="lg:col-span-2 bg-[#111113] border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Lead Pipeline</h2>
          {pipelineLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">Loading pipeline data...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineData} barCategoryGap="20%">
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1c23',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fafafa',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Agent Status */}
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Agent Status</h2>
          <div className="space-y-3">
            {(Object.keys(AGENT_TYPE_CONFIG) as AgentType[]).map((type) => {
              const config = AGENT_TYPE_CONFIG[type]
              const status = agentStatuses?.[type]
              const icons: Record<AgentType, typeof Zap> = {
                scout: Search,
                qualifier: Bot,
                dm_sender: MessageSquare,
                contact_extractor: Phone,
                keyword_evolver: Zap,
                appointment_booker: Calendar,
              }
              const Icon = icons[type]
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-gray-800 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{config.label}</p>
                      {status?.lastRun && (
                        <p className="text-[10px] text-gray-600">{timeAgo(status.lastRun)}</p>
                      )}
                    </div>
                  </div>
                  <AgentStatusIndicator
                    status={status?.status || 'pending'}
                    size="sm"
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* n8n Workflow Status */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            n8n Workflow Status
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchExecutions()}
              className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
              Refresh
            </button>
            <a
              href="/n8n-monitor"
              className="text-[10px] text-emerald-400 hover:text-emerald-300"
            >
              View All
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(WORKFLOWS).map(([key, wf]) => {
            // Find latest execution for this workflow
            const latestExec = n8nExecutions?.find(e => e.workflowId === wf.id)
            const isRunning = latestExec?.status === 'running'
            const Icon = wf.triggerType === 'webhook' ? Play : Clock
            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/30 border border-gray-800/50">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  latestExec?.status === 'success' && 'bg-emerald-500/15',
                  latestExec?.status === 'error' && 'bg-red-500/15',
                  latestExec?.status === 'running' && 'bg-blue-500/15',
                  !latestExec && 'bg-gray-800',
                )}>
                  <Icon className={cn(
                    'w-4 h-4',
                    latestExec?.status === 'success' && 'text-emerald-400',
                    latestExec?.status === 'error' && 'text-red-400',
                    latestExec?.status === 'running' && 'text-blue-400 animate-spin',
                    !latestExec && 'text-gray-500',
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{wf.shortName}</p>
                  <p className="text-[10px] text-gray-500">
                    {wf.triggerType === 'schedule' ? wf.schedule : 'Webhook'}
                    {latestExec ? ` · ${timeAgo(latestExec.startedAt)}` : ''}
                  </p>
                </div>
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0',
                  latestExec?.status === 'success' && 'bg-emerald-500/10 text-emerald-400',
                  latestExec?.status === 'error' && 'bg-red-500/10 text-red-400',
                  latestExec?.status === 'running' && 'bg-blue-500/10 text-blue-400',
                  !latestExec && 'bg-gray-800 text-gray-500',
                )}>
                  {latestExec?.status || 'idle'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Source Feed — Real-time scraped commenters */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Live Source Feed
          </h2>
          <div className="flex items-center gap-2">
            <a href="/live-feed" className="text-[10px] text-emerald-400 hover:text-emerald-300">
              View All
            </a>
          </div>
        </div>
        <LiveSourceFeed />
      </div>

      {/* Follow Channel Tracker — See which channels are being followed */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-pink-400" />
            Follow Channel Tracker
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">
              {(competitors || []).filter(c => c.last_scraped_at != null).length}/{(competitors || []).length} followed
            </span>
            <a href="/competitors" className="text-[10px] text-emerald-400 hover:text-emerald-300">
              Manage
            </a>
          </div>
        </div>
        <FollowChannelTracker />
      </div>

      {/* DM Outbox — Check if DMs have been sent */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" />
            DM Outbox
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <MailCheck className="w-3 h-3 text-emerald-400" />
                {dmSent} sent
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-amber-400" />
                {dmPending} pending approval
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-400" />
                {dmQueued} queued
              </span>
            </div>
            <button
              onClick={() => refetchDms()}
              className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
            </button>
            <a
              href="/approval-queue"
              className="text-[10px] text-emerald-400 hover:text-emerald-300"
            >
              Approve DMs
            </a>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {dmLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
              <span className="ml-2 text-xs text-gray-500">Loading DMs...</span>
            </div>
          ) : dmMessages && dmMessages.length > 0 ? (
            dmMessages.map((dm) => (
              <div key={dm.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-900/30 border border-gray-800/30">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  dm.send_status === 'sent' && 'bg-emerald-500/15',
                  dm.send_status === 'queued' && 'bg-blue-500/15',
                  dm.send_status === 'failed' && 'bg-red-500/15',
                  !dm.send_status && 'bg-gray-800',
                )}>
                  {dm.send_status === 'sent' ? (
                    <MailCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : dm.send_status === 'failed' ? (
                    <MailX className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">
                    {dm.message_text ? dm.message_text.substring(0, 80) + (dm.message_text.length > 80 ? '...' : '') : 'No message text'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {dm.tier && (
                      <span className={cn(
                        'text-[9px] px-1 py-0.5 rounded',
                        dm.tier === 'tier1' && 'bg-red-500/10 text-red-400',
                        dm.tier === 'tier2' && 'bg-amber-500/10 text-amber-400',
                        dm.tier === 'tier3' && 'bg-blue-500/10 text-blue-400',
                      )}>
                        {dm.tier}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600">
                      {dm.created_at ? timeAgo(dm.created_at) : ''}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded font-medium',
                    dm.send_status === 'sent' && 'bg-emerald-500/10 text-emerald-400',
                    dm.send_status === 'queued' && 'bg-blue-500/10 text-blue-400',
                    dm.send_status === 'failed' && 'bg-red-500/10 text-red-400',
                    !dm.send_status && 'bg-gray-800 text-gray-500',
                  )}>
                    {dm.send_status || 'draft'}
                  </span>
                  {dm.approval_status && (
                    <span className={cn(
                      'text-[8px] px-1 py-0.5 rounded',
                      dm.approval_status === 'human_approved' && 'bg-emerald-500/10 text-emerald-300',
                      dm.approval_status === 'pending' && 'bg-amber-500/10 text-amber-300',
                      dm.approval_status === 'rejected' && 'bg-red-500/10 text-red-300',
                    )}>
                      {dm.approval_status === 'human_approved' ? 'approved' : dm.approval_status}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Send className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No DMs yet</p>
              <p className="text-[10px] text-gray-600 mt-1">
                The pipeline works: Scout scrapes → Qualifier scores → Message Gen writes DMs → You approve → DM Sender sends.
                DMs will appear here once generated.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: n8n Executions + Recent Activity + Trending Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* n8n Recent Executions */}
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              n8n Executions
            </h2>
            <a
              href="/n8n-monitor"
              className="text-[10px] text-emerald-400 hover:text-emerald-300"
            >
              View All
            </a>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {n8nExLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                <span className="ml-2 text-xs text-gray-500">Loading executions...</span>
              </div>
            ) : n8nExecutions && n8nExecutions.length > 0 ? (
              n8nExecutions.map((exec) => (
                <div key={exec.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/30">
                  {getN8nStatusIcon(exec.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">
                      {getExecWorkflowName(exec.workflowId, exec.workflowData?.name)}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {exec.startedAt ? timeAgo(exec.startedAt) : 'Unknown time'}
                      {exec.stoppedAt && exec.startedAt && (
                        <span className="ml-1">
                          ({((new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000).toFixed(1)}s)
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0',
                    exec.status === 'success' && 'bg-emerald-500/10 text-emerald-400',
                    exec.status === 'error' && 'bg-red-500/10 text-red-400',
                    exec.status === 'running' && 'bg-blue-500/10 text-blue-400',
                    exec.status === 'waiting' && 'bg-amber-500/10 text-amber-400',
                    exec.status === 'unknown' && 'bg-gray-800 text-gray-500',
                  )}>
                    {exec.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                No n8n executions yet. Click Kick Start to trigger workflows.
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity (from Supabase) */}
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {latestRuns && latestRuns.length > 0 ? (
              latestRuns.map((run) => (
                <div key={run.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-900/30">
                  <AgentStatusIndicator status={run.status} size="sm" showLabel={false} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate">
                      {AGENT_TYPE_CONFIG[run.agent_type as AgentType]?.label || run.agent_type}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {run.items_processed} processed
                      {run.items_failed > 0 && ` · ${run.items_failed} failed`}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-600 shrink-0">{timeAgo(run.started_at)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Trending Keywords */}
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Trending Keywords</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {topKeywords && topKeywords.length > 0 ? (
              topKeywords.map((kw, i) => (
                <div key={kw.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-900/30">
                  <span className="text-xs font-bold text-gray-600 w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-white truncate">{kw.keyword}</p>
                      <span className="text-[10px] text-gray-500">{kw.frequency_count}x</span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500/60"
                        style={{
                          width: `${Math.min(100, (kw.intent_weight || 0) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase shrink-0">{kw.category.replace('_', ' ')}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No keywords yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
