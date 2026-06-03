// Vercel Serverless Function: Auto-discover new SG interior design firms via Apify
// Scrapes Instagram hashtags and Facebook to find new competitors

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  const APIFY_TOKEN = process.env.VITE_APIFY_API_TOKEN || ''
  const APIFY_BASE = 'https://api.apify.com/v2'

  if (!APIFY_TOKEN) {
    return res.status(500).json({ error: 'Apify API token not configured' })
  }

  try {
    const { action } = req.body || {}

    // Discover new firms from Instagram hashtags
    if (action === 'discover-instagram') {
      const hashtags = req.body?.hashtags || [
        'singaporeinteriordesign',
        'sginteriordesign',
        'hdbrenovation',
        'btorenovation',
        'sgrenovation',
        'singaporereno',
        'condorenovation',
        'interiordesignsg',
        'homedecorsingapore',
        'renovationsingapore',
        'idsg',
        'sgid',
        'interiordesignersg',
      ]

      const resultsPerHashtag = req.body?.resultsPerHashtag || 20

      // Step 1: Start Apify Instagram hashtag scraper
      const startResponse = await fetch(
        `${APIFY_BASE}/acts/apify~instagram-hashtag-scraper/runs?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hashtags,
            resultsLimit: resultsPerHashtag * hashtags.length,
          }),
        }
      )

      if (!startResponse.ok) {
        const errText = await startResponse.text()
        return res.status(startResponse.status).json({ error: `Apify start failed: ${errText}` })
      }

      const runData = await startResponse.json()
      return res.status(200).json({
        status: 'started',
        runId: runData.data?.id || runData.id,
        message: `Scraping ${hashtags.length} hashtags, ~${resultsPerHashtag * hashtags.length} posts expected`,
      })
    }

    // Discover new firms from Facebook pages
    if (action === 'discover-facebook') {
      const searchTerms = req.body?.searchTerms || [
        'singapore interior design',
        'hdb renovation singapore',
        'bto renovation singapore',
        'condo renovation singapore',
        'interior designer singapore',
        'renovation contractor singapore',
        'home renovation singapore',
        'id firm singapore',
      ]

      const startResponse = await fetch(
        `${APIFY_BASE}/acts/apify~facebook-pages-scraper/runs?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startUrls: searchTerms.map(term => ({
              url: `https://www.facebook.com/search/pages/?q=${encodeURIComponent(term)}`
            })),
            maxPosts: 5,
            resultsLimit: 100,
          }),
        }
      )

      if (!startResponse.ok) {
        const errText = await startResponse.text()
        return res.status(startResponse.status).json({ error: `Apify start failed: ${errText}` })
      }

      const runData = await startResponse.json()
      return res.status(200).json({
        status: 'started',
        runId: runData.data?.id || runData.id,
        message: `Scraping Facebook pages for ${searchTerms.length} search terms`,
      })
    }

    // Check Apify run status and get results
    if (action === 'check-run') {
      const runId = req.body?.runId
      if (!runId) return res.status(400).json({ error: 'runId required' })

      const statusResponse = await fetch(
        `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`
      )

      if (!statusResponse.ok) {
        return res.status(statusResponse.status).json({ error: 'Run not found' })
      }

      const runInfo = await statusResponse.json()
      const status = runInfo.data?.status || runInfo.status

      // If run is done, fetch the dataset
      if (status === 'SUCCEEDED' || status === 'FINISHED') {
        const datasetId = runInfo.data?.defaultDatasetId || runInfo.defaultDatasetId
        if (datasetId) {
          const datasetResponse = await fetch(
            `${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=500`
          )
          const items = datasetResponse.ok ? await datasetResponse.json() : []

          return res.status(200).json({
            status: 'completed',
            runId,
            itemCount: items.length,
            items,
          })
        }
      }

      return res.status(200).json({
        status: status?.toLowerCase() || 'unknown',
        runId,
        itemCount: 0,
        items: [],
      })
    }

    // Scrape Instagram profile info for discovered firms
    if (action === 'scrape-profiles') {
      const usernames = req.body?.usernames || []
      if (usernames.length === 0) return res.status(400).json({ error: 'usernames required' })

      const startResponse = await fetch(
        `${APIFY_BASE}/acts/apify~instagram-profile-scraper/runs?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usernames,
            resultsLimit: usernames.length,
          }),
        }
      )

      if (!startResponse.ok) {
        return res.status(startResponse.status).json({ error: 'Apify profile scraper failed' })
      }

      const runData = await startResponse.json()
      return res.status(200).json({
        status: 'started',
        runId: runData.data?.id || runData.id,
        message: `Scraping ${usernames.length} Instagram profiles`,
      })
    }

    return res.status(400).json({
      error: 'Unknown action. Use: discover-instagram, discover-facebook, check-run, scrape-profiles',
    })
  } catch (error) {
    console.error('Discovery proxy error:', error)
    return res.status(500).json({ error: error.message })
  }
}
