import type { Platform } from './types'

const APIFY_BASE = 'https://api.apify.com/v2'

function getApifyToken(): string {
  return import.meta.env.VITE_APIFY_API_TOKEN || ''
}

async function apifyRequest(actorId: string, input: Record<string, unknown>, token: string = getApifyToken()) {
  if (!token) {
    console.warn('Apify API token not configured')
    return null
  }

  const runResponse = await fetch(`${APIFY_BASE}/acts/${actorId}/runs?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!runResponse.ok) {
    throw new Error(`Apify run failed: ${runResponse.statusText}`)
  }

  const runData = await runResponse.json()
  return runData
}

export async function scrapeInstagramComments(
  usernames: string[],
  maxPosts: number = 20,
  maxComments: number = 100
) {
  return apifyRequest('apify/instagram-comment-scraper', {
    usernames,
    maxPosts,
    maxComments,
    resultsLimit: maxComments * usernames.length,
  })
}

export async function scrapeFacebookComments(
  pageUrls: string[],
  maxPosts: number = 20,
  maxComments: number = 100
) {
  return apifyRequest('apify/facebook-comments-scraper', {
    startUrls: pageUrls.map(url => ({ url })),
    maxPosts,
    resultsLimit: maxComments * pageUrls.length,
  })
}

export async function scrapeTikTokComments(
  usernames: string[],
  maxPosts: number = 20,
  maxComments: number = 100
) {
  return apifyRequest('apify/tiktok-comment-scraper', {
    usernames,
    maxPosts,
    resultsLimit: maxComments * usernames.length,
  })
}

export async function enrichProfile(
  username: string,
  platform: Platform
) {
  const actorMap: Record<Platform, string> = {
    instagram: 'apify/instagram-profile-scraper',
    facebook: 'apify/facebook-pages-scraper',
    tiktok: 'apify/tiktok-profile-scraper',
  }

  return apifyRequest(actorMap[platform], {
    usernames: [username],
    resultsLimit: 1,
  })
}

export async function discoverHashtagPosts(
  hashtags: string[],
  platform: Platform,
  resultsLimit: number = 50
) {
  const actorMap: Record<Platform, string> = {
    instagram: 'apify/instagram-hashtag-scraper',
    facebook: 'apify/facebook-posts-scraper',
    tiktok: 'apify/tiktok-hashtag-scraper',
  }

  const inputMap: Record<Platform, Record<string, unknown>> = {
    instagram: { hashtags, resultsLimit },
    facebook: { startUrls: hashtags.map(h => ({ url: `https://www.facebook.com/hashtag/${h.replace('#', '')}` })), resultsLimit },
    tiktok: { hashtags, resultsLimit },
  }

  return apifyRequest(actorMap[platform], inputMap[platform])
}

export async function getActorRunStatus(runId: string, token: string = getApifyToken()) {
  if (!token) return null

  const response = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`)
  if (!response.ok) return null
  return response.json()
}

export async function getActorRunDataset(runId: string, token: string = getApifyToken()) {
  if (!token) return null

  const response = await fetch(`${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${token}&limit=1000`)
  if (!response.ok) return null
  return response.json()
}
