import { useState } from 'react'
import { useCompetitors, useAddCompetitor, useToggleCompetitor, useDeleteCompetitor } from '@/hooks/useCompetitors'
import PlatformBadge from '@/components/PlatformBadge'
import { Building2, Plus, ToggleLeft, ToggleRight, Trash2, Search, RefreshCw, ExternalLink, Zap, Camera, Globe, Loader2, CheckCircle2 } from 'lucide-react'
import { cn, timeAgo, truncate } from '@/lib/utils'
import type { Platform, DiscoveryMethod } from '@/lib/types'
import { SG_DESIGN_FIRMS } from '@/data/sg-design-firms'
import { triggerWorkflow, followChannels } from '@/lib/n8n'
import { supabase } from '@/lib/supabase'

interface ImportLog {
  message: string
  type: 'info' | 'success' | 'error'
}

export default function Competitors() {
  const { data: competitors, isLoading, refetch } = useCompetitors()
  const addCompetitor = useAddCompetitor()
  const toggleCompetitor = useToggleCompetitor()
  const deleteCompetitor = useDeleteCompetitor()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlatform, setNewPlatform] = useState<Platform>('instagram')
  const [newUsername, setNewUsername] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [search, setSearch] = useState('')
  const [isBulkImporting, setIsBulkImporting] = useState(false)
  const [importLogs, setImportLogs] = useState<ImportLog[]>([])
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })

  const filtered = search
    ? (competitors || []).filter(c =>
        c.username.toLowerCase().includes(search.toLowerCase()) ||
        (c.display_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : competitors || []

  const handleAdd = () => {
    if (!newUsername.trim()) return
    addCompetitor.mutate({
      platform: newPlatform,
      platform_id: newUsername.trim(),
      username: newUsername.trim(),
      display_name: newDisplayName.trim() || null,
      is_active: true,
      discovery_method: 'manual',
      discovery_source: 'manual_add',
      priority_score: 0.5,
    }, {
      onSuccess: () => {
        setNewUsername('')
        setNewDisplayName('')
        setShowAddForm(false)
      },
    })
  }

  const handleBulkImport = async () => {
    setIsBulkImporting(true)
    setImportLogs([])
    
    const existingUsernames = new Set((competitors || []).map(c => c.username.toLowerCase()))
    const toImport = SG_DESIGN_FIRMS.filter(
      f => !existingUsernames.has(f.username.toLowerCase())
    )

    if (toImport.length === 0) {
      setImportLogs([{ message: 'All firms already imported!', type: 'info' }])
      setIsBulkImporting(false)
      return
    }

    setImportProgress({ current: 0, total: toImport.length })
    setImportLogs([{ message: `Starting bulk import of ${toImport.length} firms...`, type: 'info' }])

    // Trigger n8n Follow Channel workflow to process the new firms
    try {
      const n8nResult = await followChannels({ platforms: ['instagram', 'facebook'] })
      if (n8nResult?.success) {
        setImportLogs(prev => [...prev, { message: `n8n Follow Channel workflow triggered`, type: 'success' }])
      }
    } catch {
      setImportLogs(prev => [...prev, { message: 'n8n not reachable, importing directly to Supabase...', type: 'info' as const }])
    }

    // Also insert directly to Supabase for immediate effect
    let imported = 0
    let failed = 0

    for (const firm of toImport) {
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
            discovery_source: 'bulk_import',
            priority_score: 0.5,
          })

        if (error) {
          if (error.code === '23505') {
            // Duplicate, skip
          } else {
            failed++
            setImportLogs(prev => [...prev, { message: `Failed: @${firm.username} — ${error.message}`, type: 'error' }])
          }
        } else {
          imported++
        }
      } catch {
        failed++
      }

      setImportProgress(prev => ({ ...prev, current: prev.current + 1 }))

      // Small delay to avoid rate limiting
      if (imported % 10 === 0) {
        await new Promise(r => setTimeout(r, 200))
      }
    }

    setImportLogs(prev => [
      ...prev,
      { message: `Import complete: ${imported} added, ${failed} failed`, type: imported > 0 ? 'success' : 'error' }
    ])

    // Follow channel workflow already triggered above for all platforms
    if (imported > 0) {
      setImportLogs(prev => [...prev, { message: 'Channels added and Follow Channel workflow triggered', type: 'success' }])
    }

    refetch()
    setIsBulkImporting(false)
  }

  const existingUsernames = new Set((competitors || []).map(c => c.username.toLowerCase()))
  const firmsToAdd = SG_DESIGN_FIRMS.filter(f => !existingUsernames.has(f.username.toLowerCase()))

  const getDiscoveryBadge = (method: DiscoveryMethod) => {
    switch (method) {
      case 'auto_discovered':
        return <span className="text-[10px] bg-emerald-500/10 text-emerald-400 rounded px-1.5 py-0.5">Auto</span>
      case 'keyword_evolved':
        return <span className="text-[10px] bg-purple-500/10 text-purple-400 rounded px-1.5 py-0.5">Evolved</span>
      case 'manual':
        return <span className="text-[10px] bg-gray-700 text-gray-300 rounded px-1.5 py-0.5">Manual</span>
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Competitors
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor competitor pages for new leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleBulkImport}
            disabled={isBulkImporting || firmsToAdd.length === 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors',
              isBulkImporting
                ? 'bg-amber-600/20 text-amber-400 cursor-wait'
                : firmsToAdd.length === 0
                ? 'bg-gray-800 text-gray-500 cursor-default'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            )}
          >
            {isBulkImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : firmsToAdd.length === 0 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isBulkImporting
              ? `Importing ${importProgress.current}/${importProgress.total}...`
              : firmsToAdd.length === 0
              ? 'All Firms Added'
              : `Add All Firms (${firmsToAdd.length})`
            }
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Competitor
          </button>
        </div>
      </div>

      {/* Import Progress */}
      {importLogs.length > 0 && (
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white">Import Log</h3>
            <button
              onClick={() => setImportLogs([])}
              className="text-[10px] text-gray-600 hover:text-gray-400"
            >
              Clear
            </button>
          </div>
          {isBulkImporting && (
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
              />
            </div>
          )}
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {importLogs.map((log, i) => (
              <p
                key={i}
                className={cn(
                  'text-[11px]',
                  log.type === 'success' && 'text-emerald-400',
                  log.type === 'error' && 'text-red-400',
                  log.type === 'info' && 'text-blue-400',
                )}
              >
                {log.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-5 space-y-3 animate-slide-in">
          <h3 className="text-sm font-semibold text-white">Add New Competitor</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value as Platform)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
            </select>
            <input
              type="text"
              placeholder="Username (e.g., @interiordesign_sg)"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
            />
            <input
              type="text"
              placeholder="Display name (optional)"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={addCompetitor.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {addCompetitor.isPending ? 'Adding...' : 'Add Competitor'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search competitors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{filtered.length} competitors</span>
        <span className="text-gray-700">·</span>
        <span className="flex items-center gap-1">
          <Camera className="w-3 h-3 text-pink-400" />
          {filtered.filter(c => c.platform === 'instagram').length} Instagram
        </span>
        <span className="text-gray-700">·</span>
        <span className="flex items-center gap-1">
          <Globe className="w-3 h-3 text-blue-400" />
          {filtered.filter(c => c.platform === 'facebook').length} Facebook
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading competitors...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No competitors added yet</p>
          <p className="text-gray-600 text-xs mt-1">Click "Add All Firms" to import {SG_DESIGN_FIRMS.length} Singapore design firms</p>
        </div>
      ) : (
        <div className="bg-[#111113] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Competitor</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Platform</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Followers</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Followed</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Discovery</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((comp) => (
                  <tr key={comp.id} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                          {comp.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{comp.display_name || comp.username}</p>
                          <p className="text-[10px] text-gray-500">@{comp.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PlatformBadge platform={comp.platform} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {comp.follower_count ? comp.follower_count.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {comp.last_scraped_at != null ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 rounded px-1.5 py-0.5">Followed</span>
                      ) : (
                        <span className="text-[10px] bg-gray-700 text-gray-400 rounded px-1.5 py-0.5">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getDiscoveryBadge((comp.discovery_method || 'manual') as DiscoveryMethod)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleCompetitor.mutate({ id: comp.id, isActive: !comp.is_active })}
                        className="flex items-center gap-1"
                      >
                        {comp.is_active ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-600" />
                        )}
                        <span className={cn('text-xs', comp.is_active ? 'text-emerald-400' : 'text-gray-600')}>
                          {comp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteCompetitor.mutate(comp.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
