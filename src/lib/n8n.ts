// n8n Cloud Integration — via Vercel Serverless Proxy
// All n8n API calls go through /api/n8n-proxy to avoid CORS issues
// Webhook triggers go through /api/n8n-proxy (trigger-webhook action)

const PROXY_URL = '/api/n8n-proxy'

// ===== Known Workflow Configuration =====
// These are the actual n8n Cloud workflow IDs and their trigger methods
// Schedule-based workflows run automatically; Webhook-based need manual trigger

export interface WorkflowConfig {
  id: string
  name: string
  shortName: string
  triggerType: 'schedule' | 'webhook'
  webhookPath?: string
  schedule?: string
  active: boolean
}

export const WORKFLOWS: Record<string, WorkflowConfig> = {
  discovery: {
    id: 'ApG6D1ufVNVeoT1a',
    name: 'LeadForge — Discovery Agent (Find New Competitors)',
    shortName: 'Discovery',
    triggerType: 'schedule',
    schedule: 'Every 24 hours',
    active: true,
  },
  follow_up: {
    id: 'IPQq6Vi128jGQQBW',
    name: 'LeadForge — Follow-up Agent (Auto Follow-up Sequence)',
    shortName: 'Follow-up',
    triggerType: 'schedule',
    schedule: 'Every 6 hours',
    active: true,
  },
  dm_sender: {
    id: 'UYGwFRb6qFT0LpxV',
    name: 'LeadForge — DM Sender Agent (Send Approved Messages)',
    shortName: 'DM Sender',
    triggerType: 'schedule',
    schedule: 'Every 5 minutes',
    active: true,
  },
  scout: {
    id: 'UfXfcDHSWOOmgq44',
    name: 'LeadForge — Scout Agent (Scrape Competitor Comments)',
    shortName: 'Scout',
    triggerType: 'schedule',
    schedule: 'Every 30 min',
    active: true,
  },
  keyword_evolver: {
    id: 'Y4tp84H2cZhd6ZLQ',
    name: 'LeadForge — Keyword Evolution Agent (Auto-discover New Keywords)',
    shortName: 'Keyword Evolution',
    triggerType: 'schedule',
    schedule: 'Every 12 hours',
    active: true,
  },
  response_handler: {
    id: 'bS2aLqtDroPLU1iE',
    name: 'LeadForge — Response Handler (Process DM Replies & Extract Contact)',
    shortName: 'Response Handler',
    triggerType: 'webhook',
    webhookPath: 'response-handler',
    active: true,
  },
  message_gen: {
    id: 'na6tW5B9NRjksB01',
    name: 'LeadForge — Message Generation Agent (AI DM Writer)',
    shortName: 'Message Gen',
    triggerType: 'webhook',
    webhookPath: 'message-gen',
    active: true,
  },
  qualifier: {
    id: 'w3jhPfDVxJRCg1AL',
    name: 'LeadForge — Qualification Agent (AI Score & Tier Leads)',
    shortName: 'Qualifier',
    triggerType: 'webhook',
    webhookPath: 'qualification',
    active: true,
  },
  follow_channel: {
    id: 'y0R8rgAxvEqsxkg5',
    name: 'LeadForge — Follow & Add Channel Agent (Follow IG/FB Competitors)',
    shortName: 'Follow Channel',
    triggerType: 'webhook',
    webhookPath: 'follow-add-channel',
    active: true,
  },
}

// Workflow ID cache — discovered from n8n Cloud on first call
let _workflowCache: N8nWorkflow[] = []
let _lastDiscoveryTime = 0
const DISCOVERY_CACHE_TTL = 60000 // Cache workflows for 60s

interface N8nRunResponse {
  id: string
  status: string
  mode: string
  startedAt: string
  workflowId: string
}

interface N8nWorkflow {
  id: string
  name: string
  active: boolean
}

interface N8nExecution {
  id: string
  finished: boolean
  mode: string
  startedAt: string
  stoppedAt?: string
  workflowId: string
  status: string
  workflowData?: {
    name: string
  }
}

interface N8nExecutionDetail {
  id: string
  finished: boolean
  mode: string
  startedAt: string
  stoppedAt?: string
  status: string
  workflowData?: {
    name: string
    nodes?: Array<{ name: string; type: string }>
  }
  data?: {
    resultData?: {
      runData?: Record<string, Array<{
        startTime: number
        executionTime: number
        executionStatus: string
        data?: {
          main?: Array<Array<{ json: Record<string, unknown> }>>
        }
      }>>
    }
  }
}

interface N8nProxyError {
  error: string
  isTimeout?: boolean
  details?: string
}

// ===== Proxy Helper =====

async function n8nProxy(action: string, data: Record<string, unknown> = {}): Promise<any> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
    })

    const result = await response.json()

    if (!response.ok) {
      const proxyError = result as N8nProxyError
      const errMsg = proxyError.error || `HTTP ${response.status}`
      const error = new Error(errMsg)
      ;(error as any).isTimeout = proxyError.isTimeout
      ;(error as any).details = proxyError.details
      throw error
    }

    return result
  } catch (error: any) {
    // Network error (proxy unreachable)
    if (error instanceof TypeError && error.message?.includes('fetch')) {
      console.error('n8n proxy network error — is the site deployed correctly?')
      throw new Error('Cannot reach n8n proxy. Make sure the app is deployed on Vercel.')
    }
    console.error('n8n proxy call failed:', error.message)
    throw error
  }
}

// ===== Workflow Discovery =====

export async function discoverWorkflows(forceRefresh = false): Promise<N8nWorkflow[]> {
  const now = Date.now()

  // Return cached if fresh
  if (!forceRefresh && _workflowCache.length > 0 && (now - _lastDiscoveryTime) < DISCOVERY_CACHE_TTL) {
    return _workflowCache
  }

  try {
    const result = await n8nProxy('list-workflows')
    const workflows: N8nWorkflow[] = result.data || []

    _workflowCache = workflows
    _lastDiscoveryTime = now
    return workflows
  } catch (error: any) {
    console.warn('Workflow discovery failed:', error.message)
    // Return stale cache if available
    if (_workflowCache.length > 0) return _workflowCache
    return []
  }
}

// ===== Core n8n Operations =====

export async function triggerWorkflow(
  workflowKey: string,
  inputData?: Record<string, unknown>
): Promise<{ success: boolean; message: string; executionId?: string }> {
  const config = WORKFLOWS[workflowKey]

  if (!config) {
    throw new Error(`Unknown workflow key: "${workflowKey}". Available: ${Object.keys(WORKFLOWS).join(', ')}`)
  }

  if (config.triggerType === 'webhook' && config.webhookPath) {
    // Trigger via webhook (through proxy to avoid CORS)
    try {
      const result = await n8nProxy('trigger-webhook', {
        webhookPath: config.webhookPath,
        inputData: inputData || {},
      })
      return {
        success: true,
        message: `${config.shortName} webhook triggered successfully`,
        executionId: result.executionId,
      }
    } catch (error: any) {
      throw new Error(`${config.shortName} webhook failed: ${error.message}`)
    }
  } else {
    // Schedule-based: we can't manually trigger via REST API, just confirm it's active
    if (config.active) {
      return {
        success: true,
        message: `${config.shortName} runs on schedule (${config.schedule}). It's active and running automatically.`,
      }
    } else {
      // Try to activate it
      try {
        await n8nProxy('activate-workflow', { workflowId: config.id })
        return {
          success: true,
          message: `${config.shortName} was inactive — now activated. It runs ${config.schedule}.`,
        }
      } catch (error: any) {
        throw new Error(`${config.shortName} is inactive and could not be activated: ${error.message}`)
      }
    }
  }
}

export async function listWorkflows(): Promise<N8nWorkflow[]> {
  return discoverWorkflows(true)
}

export async function getWorkflow(workflowId: string): Promise<N8nWorkflow | null> {
  try {
    return await n8nProxy('get-workflow', { workflowId })
  } catch {
    return null
  }
}

// ===== Execution History (for visibility) =====

export async function getExecutions(limit: number = 20): Promise<N8nExecution[]> {
  try {
    const result = await n8nProxy('get-executions', { limit })
    return result.data || []
  } catch {
    return []
  }
}

export async function getExecutionDetail(executionId: string): Promise<N8nExecutionDetail | null> {
  try {
    return await n8nProxy('get-execution', { executionId })
  } catch {
    return null
  }
}

export async function activateWorkflow(workflowId: string): Promise<N8nWorkflow | null> {
  try {
    return await n8nProxy('activate-workflow', { workflowId })
  } catch {
    return null
  }
}


export async function runWorkflow(workflowId: string): Promise<{ success: boolean; executionId?: string } | null> {
  try {
    const result = await n8nProxy('run-workflow', { workflowId })
    return { success: true, executionId: result.executionId }
  } catch {
    return null
  }
}

// ===== High-level Agent Functions =====

export async function kickStartAgent(options?: {
  platforms?: ('instagram' | 'facebook' | 'tiktok')[]
  competitorLimit?: number
  maxComments?: number
}): Promise<{
  scout: { success: boolean; message: string; executionId?: string } | null
  qualifier: { success: boolean; message: string; executionId?: string } | null
  followChannel: { success: boolean; message: string; executionId?: string } | null
  discovery: { success: boolean; executionId?: string } | null
  errors: string[]
}> {
  const inputData = {
    platforms: options?.platforms || ['instagram', 'facebook'],
    competitor_limit: options?.competitorLimit || 20,
    max_comments: options?.maxComments || 100,
    triggered_by: 'dashboard_kick_start',
    timestamp: new Date().toISOString(),
  }

  const results = {
    scout: null as { success: boolean; message: string; executionId?: string } | null,
    qualifier: null as { success: boolean; message: string; executionId?: string } | null,
    followChannel: null as { success: boolean; message: string; executionId?: string } | null,
    discovery: null as { success: boolean; executionId?: string } | null,
    errors: [] as string[],
  }

  // Step 1: Ensure all main workflows are active (non-stop schedule)
  const scheduleWorkflows = ['discovery', 'scout', 'follow_up', 'dm_sender', 'keyword_evolver']
  for (const key of scheduleWorkflows) {
    const wf = WORKFLOWS[key]
    if (wf) {
      n8nProxy('activate-workflow', { workflowId: wf.id }).catch(() => {})
    }
  }

  // Step 2: Immediately run Discovery + Scout (don't wait for next schedule)
  try {
    const discResult = await runWorkflow(WORKFLOWS.discovery.id)
    results.discovery = discResult || { success: false }
  } catch (e: any) {
    results.errors.push(`Discovery: ${e.message}`)
  }

  try {
    const scoutResult = await runWorkflow(WORKFLOWS.scout.id)
    results.scout = scoutResult
      ? { success: true, message: 'Scout running now — scraping competitor comments', executionId: scoutResult.executionId }
      : { success: false, message: 'Scout activated on schedule' }
  } catch (e: any) {
    results.errors.push(`Scout: ${e.message}`)
  }

  // Step 3: Trigger webhook-based qualifier
  try {
    results.qualifier = await triggerWorkflow('qualifier', inputData)
  } catch (e: any) {
    results.errors.push(`Qualifier: ${e.message}`)
  }

  // Step 4: Trigger Follow & Add Channel
  try {
    results.followChannel = await triggerWorkflow('follow_channel', inputData)
  } catch (e: any) {
    results.errors.push(`Follow Channel: ${e.message}`)
  }

  return results
}

export async function followChannel(params: {
  username: string
  platform?: string
}): Promise<{ success: boolean; message: string; executionId?: string } | null> {
  try {
    return await triggerWorkflow('follow_channel', {
      username: params.username,
      platform: params.platform || 'instagram',
      triggered_by: 'dashboard_follow_channel',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return null
  }
}

// Bulk follow multiple channels (triggers one webhook per channel)
export async function followChannels(options?: {
  usernames?: Array<{ username: string; platform: string }>
  platforms?: string[]
}): Promise<{ success: boolean; message: string; executionId?: string } | null> {
  // If specific usernames provided, follow each one individually
  if (options?.usernames && options.usernames.length > 0) {
    let successCount = 0
    let lastResult: { success: boolean; message: string; executionId?: string } | null = null
    for (const ch of options.usernames) {
      const result = await followChannel({ username: ch.username, platform: ch.platform })
      if (result?.success) successCount++
      lastResult = result
      // Small delay between webhook triggers to avoid overwhelming n8n
      await new Promise(r => setTimeout(r, 500))
    }
    return lastResult
      ? { ...lastResult, message: `${successCount}/${options.usernames.length} channels triggered` }
      : null
  }
  // Fallback: just trigger with platform list (legacy behavior)
  try {
    return await triggerWorkflow('follow_channel', {
      platforms: options?.platforms || ['instagram', 'facebook'],
      triggered_by: 'dashboard_follow_channels',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return null
  }
}

export async function triggerDMSender(params: {
  leadIds?: string[]
  tier?: string
  maxMessages?: number
}): Promise<{ success: boolean; message: string } | null> {
  try {
    return await triggerWorkflow('dm_sender', {
      lead_ids: params.leadIds,
      tier: params.tier || 'tier1',
      max_messages: params.maxMessages || 50,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return null
  }
}

export async function triggerQualifier(params: {
  leadIds?: string[]
}): Promise<{ success: boolean; message: string; executionId?: string } | null> {
  try {
    return await triggerWorkflow('qualifier', {
      lead_ids: params.leadIds,
      triggered_by: 'manual_trigger',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return null
  }
}

export async function triggerMessageGen(params: {
  leadIds?: string[]
}): Promise<{ success: boolean; message: string; executionId?: string } | null> {
  try {
    return await triggerWorkflow('message_gen', {
      lead_ids: params.leadIds,
      triggered_by: 'manual_trigger',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return null
  }
}

export async function triggerResponseHandler(params: {
  leadIds?: string[]
}): Promise<{ success: boolean; message: string; executionId?: string } | null> {
  try {
    return await triggerWorkflow('response_handler', {
      lead_ids: params.leadIds,
      triggered_by: 'manual_trigger',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return null
  }
}

export async function triggerKeywordEvolver(): Promise<{ success: boolean; message: string } | null> {
  try {
    return await triggerWorkflow('keyword_evolver', {
      timestamp: new Date().toISOString(),
    })
  } catch {
    return null
  }
}

// Get workflow config for display
export function getWorkflowConfigs(): Record<string, WorkflowConfig> {
  return { ...WORKFLOWS }
}

// Get the workflow name from a workflow ID (for execution display)
export function getWorkflowNameById(workflowId: string): string {
  for (const config of Object.values(WORKFLOWS)) {
    if (config.id === workflowId) return config.shortName
  }
  return `Workflow ${workflowId}`
}

// Re-export types
export type { N8nWorkflow, N8nExecution, N8nExecutionDetail, N8nRunResponse }
