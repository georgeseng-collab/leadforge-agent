import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Key, Clock, Shield, MapPin, Save, Eye, EyeOff, Check, Zap, RefreshCw, AlertCircle, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { listWorkflows, getExecutions } from '@/lib/n8n'
import type { N8nWorkflow, N8nExecution } from '@/lib/n8n'

interface SettingsState {
  apifyToken: string
  openaiKey: string
  metaPageToken: string
  calApiKey: string
  scoutInterval: number
  followUpDelay: number
  dmRateLimit: number
  autoApproveThreshold: number
  btoMonitorEnabled: boolean
  btoKeywords: string
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    apifyToken: '',
    openaiKey: '',
    metaPageToken: '',
    calApiKey: '',
    scoutInterval: 30,
    followUpDelay: 24,
    dmRateLimit: 50,
    autoApproveThreshold: 0.9,
    btoMonitorEnabled: true,
    btoKeywords: 'BTO, HDB, keys collection, renovation package, new flat',
  })

  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({
    apify: false,
    openai: false,
    meta: false,
    cal: false,
  })

  const [saved, setSaved] = useState(false)

  // n8n connection test state
  const [n8nTesting, setN8nTesting] = useState(false)
  const [n8nWorkflows, setN8nWorkflows] = useState<N8nWorkflow[]>([])
  const [n8nRecentExecs, setN8nRecentExecs] = useState<N8nExecution[]>([])
  const [n8nStatus, setN8nStatus] = useState<'idle' | 'testing' | 'connected' | 'error' | 'timeout'>('idle')
  const [n8nError, setN8nError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('leadforge-settings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {}
    } else {
      setSettings(prev => ({
        ...prev,
        apifyToken: import.meta.env.VITE_APIFY_API_TOKEN || '',
        openaiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        metaPageToken: import.meta.env.VITE_META_PAGE_TOKEN || '',
        calApiKey: import.meta.env.VITE_CAL_API_KEY || '',
      }))
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('leadforge-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const testN8nConnection = async () => {
    setN8nTesting(true)
    setN8nStatus('testing')
    setN8nError('')

    try {
      const [workflows, execs] = await Promise.all([
        listWorkflows(),
        getExecutions(5),
      ])

      setN8nWorkflows(workflows)
      setN8nRecentExecs(execs)

      if (workflows.length > 0) {
        setN8nStatus('connected')
      } else {
        setN8nStatus('error')
        setN8nError('Connected but no workflows found. Create workflows in n8n Cloud first.')
      }
    } catch (error: any) {
      const msg = error?.message || 'Unknown error'
      if (msg.includes('timed out') || msg.includes('timeout')) {
        setN8nStatus('timeout')
        setN8nError('n8n Cloud is taking too long to respond. It may be in sleep mode — try again in 30 seconds after opening n8n Cloud in your browser.')
      } else {
        setN8nStatus('error')
        setN8nError(msg)
      }
    } finally {
      setN8nTesting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure API keys, agent schedules, and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors',
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          )}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* n8n Connection */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">n8n Cloud Connection</h2>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://leadforge.app.n8n.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Open n8n
            </a>
            <button
              onClick={testN8nConnection}
              disabled={n8nTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {n8nTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Test Connection
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className={cn(
          'rounded-lg p-3 flex items-start gap-3',
          n8nStatus === 'connected' && 'bg-emerald-500/10 border border-emerald-500/20',
          n8nStatus === 'error' && 'bg-red-500/10 border border-red-500/20',
          n8nStatus === 'timeout' && 'bg-amber-500/10 border border-amber-500/20',
          n8nStatus === 'idle' && 'bg-gray-900/50 border border-gray-800',
        )}>
          {n8nStatus === 'connected' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
          {n8nStatus === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
          {n8nStatus === 'timeout' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
          {n8nStatus === 'idle' && <Zap className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />}
          <div>
            {n8nStatus === 'connected' && (
              <>
                <p className="text-xs font-medium text-emerald-300">Connected to n8n Cloud</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {n8nWorkflows.length} workflows ({n8nWorkflows.filter(w => w.active).length} active)
                  {n8nRecentExecs.length > 0 && ` · ${n8nRecentExecs.length} recent executions`}
                </p>
              </>
            )}
            {n8nStatus === 'error' && (
              <>
                <p className="text-xs font-medium text-red-300">Connection Error</p>
                <p className="text-[10px] text-red-400/70 mt-0.5">{n8nError}</p>
              </>
            )}
            {n8nStatus === 'timeout' && (
              <>
                <p className="text-xs font-medium text-amber-300">Connection Timeout</p>
                <p className="text-[10px] text-amber-400/70 mt-0.5">{n8nError}</p>
              </>
            )}
            {n8nStatus === 'idle' && (
              <p className="text-xs text-gray-500">Click "Test Connection" to verify n8n Cloud is reachable</p>
            )}
          </div>
        </div>

        {/* Workflow list */}
        {n8nWorkflows.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Workflows</p>
            {n8nWorkflows.map(wf => (
              <div key={wf.id} className="flex items-center justify-between p-2 rounded bg-gray-900/30">
                <span className="text-xs text-white">{wf.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">ID: {wf.id}</span>
                  <div className={cn('w-2 h-2 rounded-full', wf.active ? 'bg-emerald-400' : 'bg-gray-600')} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Keys */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">API Keys</h2>
        </div>

        {[
          { key: 'apifyToken' as const, label: 'Apify API Token', toggleKey: 'apify', placeholder: 'apify_api_...' },
          { key: 'openaiKey' as const, label: 'OpenAI API Key', toggleKey: 'openai', placeholder: 'sk-...' },
          { key: 'metaPageToken' as const, label: 'Meta Page Token', toggleKey: 'meta', placeholder: 'EAAJ...' },
          { key: 'calApiKey' as const, label: 'Cal.com API Key', toggleKey: 'cal', placeholder: 'cal_live_...' },
        ].map(({ key, label, toggleKey, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-gray-400 block mb-1">{label}</label>
            <div className="relative">
              <input
                type={showTokens[toggleKey] ? 'text' : 'password'}
                value={settings[key]}
                onChange={(e) => updateSetting(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
              <button
                onClick={() => setShowTokens(prev => ({ ...prev, [toggleKey]: !prev[toggleKey] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"
              >
                {showTokens[toggleKey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Schedule */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Agent Schedule</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Scout Interval (minutes)</label>
            <input
              type="number"
              min={5}
              max={120}
              value={settings.scoutInterval}
              onChange={(e) => updateSetting('scoutInterval', parseInt(e.target.value) || 30)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
            <p className="text-[10px] text-gray-600 mt-1">How often the Scout agent scrapes competitor pages</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Follow-up Delay (hours)</label>
            <input
              type="number"
              min={1}
              max={168}
              value={settings.followUpDelay}
              onChange={(e) => updateSetting('followUpDelay', parseInt(e.target.value) || 24)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
            <p className="text-[10px] text-gray-600 mt-1">Delay before sending follow-up DMs</p>
          </div>
        </div>
      </div>

      {/* DM Rate Limits */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">DM Rate Limits & Approval</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">DM Rate Limit (per day)</label>
            <input
              type="number"
              min={10}
              max={200}
              value={settings.dmRateLimit}
              onChange={(e) => updateSetting('dmRateLimit', parseInt(e.target.value) || 50)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
            <p className="text-[10px] text-gray-600 mt-1">Max DMs sent per day across all platforms</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Auto-Approve Threshold</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.05}
                value={settings.autoApproveThreshold}
                onChange={(e) => updateSetting('autoApproveThreshold', parseFloat(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="text-sm text-white font-mono w-12 text-right">
                {Math.round(settings.autoApproveThreshold * 100)}%
              </span>
            </div>
            <p className="text-[10px] text-gray-600 mt-1">
              AI confidence above this threshold auto-approves DMs
            </p>
          </div>
        </div>
      </div>

      {/* Singapore-specific settings */}
      <div className="bg-[#111113] border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Singapore Market Settings</h2>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">BTO Launch Monitoring</label>
            <button
              onClick={() => updateSetting('btoMonitorEnabled', !settings.btoMonitorEnabled)}
              className={settings.btoMonitorEnabled ? 'text-emerald-400' : 'text-gray-600'}
            >
              {settings.btoMonitorEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          {settings.btoMonitorEnabled && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">BTO Keywords to Monitor</label>
              <textarea
                value={settings.btoKeywords}
                onChange={(e) => updateSetting('btoKeywords', e.target.value)}
                rows={3}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500/50 resize-none"
                placeholder="BTO, HDB, keys collection..."
              />
              <p className="text-[10px] text-gray-600 mt-1">
                Comma-separated keywords. The Scout agent will monitor for these during BTO launch periods.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
