// Vercel Serverless Function: Proxy to n8n Cloud API
// Supports REST API calls + webhook triggers for n8n workflows

const N8N_TIMEOUT = 25000 // 25s timeout for n8n API calls

async function fetchWithTimeout(url, options = {}, timeout = N8N_TIMEOUT) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout / 1000}s`)
    }
    throw error
  }
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  // Try both VITE_ prefixed (client) and non-prefixed (server) env vars
  const N8N_BASE = process.env.N8N_BASE_URL || process.env.VITE_N8N_BASE_URL || 'https://leadforge.app.n8n.cloud'
  const N8N_KEY = process.env.N8N_API_KEY || process.env.VITE_N8N_API_KEY || ''

  if (!N8N_KEY) {
    return res.status(500).json({ error: 'n8n API key not configured on server' })
  }

  const headers = {
    'X-N8N-API-KEY': N8N_KEY,
    'Accept': 'application/json',
  }

  try {
    const { action, workflowId, inputData, executionId, limit, webhookPath } = req.body || {}

    switch (action) {
      case 'list-workflows': {
        const response = await fetchWithTimeout(`${N8N_BASE}/api/v1/workflows`, { headers })
        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          return res.status(response.status).json({ error: `n8n API error: ${response.status}`, details: errText })
        }
        const data = await response.json()
        return res.status(200).json(data)
      }

      case 'get-workflow': {
        if (!workflowId) return res.status(400).json({ error: 'workflowId required' })
        const response = await fetchWithTimeout(`${N8N_BASE}/api/v1/workflows/${workflowId}`, { headers })
        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          return res.status(response.status).json({ error: `n8n API error: ${response.status}`, details: errText })
        }
        const data = await response.json()
        return res.status(200).json(data)
      }

      case 'trigger-webhook': {
        // Trigger an n8n workflow via its webhook URL
        // This is the correct way to manually trigger webhook-based workflows
        if (!webhookPath) return res.status(400).json({ error: 'webhookPath required' })

        const webhookUrl = `${N8N_BASE}/webhook/${webhookPath}`
        const response = await fetchWithTimeout(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputData || {}),
        }, 15000) // Shorter timeout for webhooks

        // Webhooks may return 200 with empty body or JSON
        let responseData = {}
        try {
          const text = await response.text()
          if (text) responseData = JSON.parse(text)
        } catch {
          // Empty response is OK for webhooks
        }

        if (!response.ok) {
          return res.status(response.status).json({
            error: `Webhook trigger failed: HTTP ${response.status}`,
            details: JSON.stringify(responseData),
          })
        }

        // After triggering webhook, check for the latest execution
        let executionId = null
        try {
          // Wait a moment for execution to register
          await new Promise(r => setTimeout(r, 1000))
          const execResponse = await fetchWithTimeout(
            `${N8N_BASE}/api/v1/executions?limit=1`,
            { headers }
          )
          if (execResponse.ok) {
            const execData = await execResponse.json()
            if (execData.data && execData.data.length > 0) {
              executionId = execData.data[0].id
            }
          }
        } catch {
          // Non-critical - execution may still be starting
        }

        return res.status(200).json({
          success: true,
          message: `Webhook ${webhookPath} triggered successfully`,
          executionId,
          webhookResponse: responseData,
        })
      }

      case 'get-executions': {
        const execLimit = limit || 20
        const response = await fetchWithTimeout(`${N8N_BASE}/api/v1/executions?limit=${execLimit}`, { headers })
        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          return res.status(response.status).json({ error: `n8n API error: ${response.status}`, details: errText })
        }
        const data = await response.json()
        return res.status(200).json(data)
      }

      case 'get-execution': {
        if (!executionId) return res.status(400).json({ error: 'executionId required' })
        const response = await fetchWithTimeout(`${N8N_BASE}/api/v1/executions/${executionId}`, { headers })
        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          return res.status(response.status).json({ error: `n8n API error: ${response.status}`, details: errText })
        }
        const data = await response.json()
        return res.status(200).json(data)
      }

      case 'activate-workflow': {
        if (!workflowId) return res.status(400).json({ error: 'workflowId required' })
        const response = await fetchWithTimeout(`${N8N_BASE}/api/v1/workflows/${workflowId}`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: true }),
        })
        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          return res.status(response.status).json({ error: `n8n API error: ${response.status}`, details: errText })
        }
        const data = await response.json()
        return res.status(200).json(data)
      }


      case 'run-workflow': {
        // Manually trigger a workflow execution (works for all workflow types)
        if (!workflowId) return res.status(400).json({ error: 'workflowId required' })
        const response = await fetchWithTimeout(`${N8N_BASE}/api/v1/workflows/${workflowId}/run`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }, 20000)
        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          return res.status(response.status).json({ error: `n8n run error: ${response.status}`, details: errText })
        }
        const data = await response.json()
        return res.status(200).json({ success: true, executionId: data.executionId || data.id, ...data })
      }

      default:
        return res.status(400).json({
          error: 'Unknown action',
          availableActions: ['list-workflows', 'get-workflow', 'trigger-webhook', 'run-workflow', 'get-executions', 'get-execution', 'activate-workflow'],
        })
    }
  } catch (error) {
    console.error('n8n proxy error:', error)
    const isTimeout = error.message?.includes('timed out')
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'n8n Cloud API timed out — the server may be sleeping or slow to respond. Try again in 30 seconds.' : error.message,
      isTimeout,
    })
  }
}
