import { useState } from 'react'
import { useKeywords, useAddKeyword, useToggleKeyword, useDeleteKeyword } from '@/hooks/useKeywords'
import { cn, truncate } from '@/lib/utils'
import type { KeywordCategory, DiscoveryMethod } from '@/lib/types'
import { Search, Plus, Zap, ToggleLeft, ToggleRight, Trash2, Sparkles, BarChart3 } from 'lucide-react'

export default function Keywords() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [newCategory, setNewCategory] = useState<KeywordCategory>('intent_signal')
  const [newWeight, setNewWeight] = useState(0.5)

  const { data: keywords, isLoading } = useKeywords({
    category: categoryFilter !== 'all' ? (categoryFilter as KeywordCategory) : undefined,
    search: search || undefined,
  })

  const addKeyword = useAddKeyword()
  const toggleKeyword = useToggleKeyword()
  const deleteKeyword = useDeleteKeyword()

  const handleAdd = () => {
    if (!newKeyword.trim()) return
    addKeyword.mutate({
      keyword: newKeyword.trim(),
      category: newCategory,
      intent_weight: newWeight,
      frequency_count: 0,
      conversion_rate: null,
      source_platform: null,
      discovery_method: 'manual' as DiscoveryMethod,
      is_active: true,
      last_seen_at: null,
    }, {
      onSuccess: () => {
        setNewKeyword('')
        setShowAddForm(false)
      },
    })
  }

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'All Categories' },
    { key: 'intent_signal', label: 'Intent Signal' },
    { key: 'hashtag', label: 'Hashtag' },
    { key: 'budget_signal', label: 'Budget Signal' },
    { key: 'location_signal', label: 'Location Signal' },
    { key: 'style_preference', label: 'Style Preference' },
    { key: 'urgency_signal', label: 'Urgency Signal' },
    { key: 'negative_signal', label: 'Negative Signal' },
  ]

  const getDiscoveryBadge = (method: DiscoveryMethod) => {
    switch (method) {
      case 'auto_discovered':
        return <span className="text-[10px] bg-emerald-500/10 text-emerald-400 rounded px-1.5 py-0.5 flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />Auto</span>
      case 'keyword_evolved':
        return <span className="text-[10px] bg-purple-500/10 text-purple-400 rounded px-1.5 py-0.5 flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />Evolved</span>
      case 'manual':
        return <span className="text-[10px] bg-gray-700 text-gray-300 rounded px-1.5 py-0.5">Manual</span>
    }
  }

  const getCategoryColor = (cat: KeywordCategory) => {
    const colors: Record<KeywordCategory, string> = {
      intent_signal: '#3b82f6',
      hashtag: '#8b5cf6',
      budget_signal: '#f59e0b',
      location_signal: '#10b981',
      style_preference: '#ec4899',
      urgency_signal: '#ef4444',
      negative_signal: '#6b7280',
    }
    return colors[cat] || '#6b7280'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            Keywords
          </h1>
          <p className="text-sm text-gray-500 mt-1">Adaptive keyword engine for lead discovery</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
            Evolve
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Keyword
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#111113] border border-gray-800 rounded-xl p-5 space-y-3 animate-slide-in">
          <h3 className="text-sm font-semibold text-white">Add New Keyword</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Keyword (e.g., BTO renovation)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as KeywordCategory)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            >
              {categories.filter(c => c.key !== 'all').map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Weight:</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={newWeight}
                onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                className="w-24 accent-emerald-500"
              />
              <span className="text-xs text-gray-400">{newWeight.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} disabled={addKeyword.isPending} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50">
              {addKeyword.isPending ? 'Adding...' : 'Add Keyword'}
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-0.5 border border-gray-800 flex-wrap">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategoryFilter(c.key)}
              className={cn(
                'px-2.5 py-1 text-[11px] rounded-md transition-colors whitespace-nowrap',
                categoryFilter === c.key ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading keywords...</div>
      ) : (keywords || []).length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No keywords found</p>
          <p className="text-gray-600 text-xs mt-1">Add keywords manually or let the Evolver agent discover them</p>
        </div>
      ) : (
        <div className="bg-[#111113] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Keyword</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Category</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Intent Weight</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Frequency</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Conversion</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Source</th>
                  <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(keywords || []).map((kw) => (
                  <tr key={kw.id} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">{kw.keyword}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] rounded px-1.5 py-0.5 font-medium"
                        style={{
                          color: getCategoryColor(kw.category),
                          backgroundColor: `${getCategoryColor(kw.category)}20`,
                        }}
                      >
                        {kw.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500/60"
                            style={{ width: `${(kw.intent_weight || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{(kw.intent_weight || 0).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{kw.frequency_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {kw.conversion_rate !== null ? `${(kw.conversion_rate * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3">{getDiscoveryBadge(kw.discovery_method)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleKeyword.mutate({ id: kw.id, isActive: !kw.is_active })}
                        className="flex items-center gap-1"
                      >
                        {kw.is_active ? (
                          <ToggleRight className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteKeyword.mutate(kw.id)}
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
