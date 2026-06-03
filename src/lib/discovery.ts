// Live Auto-Discovery Engine
// Continuously discovers new Singapore interior design firms from social media

const PROXY_URL = '/api/discover'

// Singapore interior design hashtags for continuous discovery
export const SG_DISCOVERY_HASHTAGS = {
  instagram: [
    // Core design hashtags
    'singaporeinteriordesign',
    'sginteriordesign',
    'interiordesignsg',
    'interiordesignersg',
    'idsg',
    'sgid',
    // Renovation-specific
    'hdbrenovation',
    'btorenovation',
    'condorenovation',
    'sgrenovation',
    'singaporereno',
    'renovationsingapore',
    'homedecorsingapore',
    // Style-specific
    'minimalistsg',
    'scandinaviansg',
    'japandisg',
    'industrialstylesg',
    'moderninteriorsg',
    // Property-specific
    'bto2024',
    'bto2025',
    'hdbdesign',
    'condodesignsg',
    'ecdesignsg',
    // Budget/value
    'budgetrenovation',
    'affordablereno',
    'renovationpackage',
    'hdbpackage',
  ],
  facebook: [
    'singapore interior design',
    'hdb renovation singapore',
    'bto renovation singapore',
    'condo renovation singapore',
    'interior designer singapore',
    'renovation contractor singapore',
    'home renovation singapore',
    'id firm singapore',
    'cheap renovation singapore',
    'best interior design singapore',
    'hdb bto renovation',
    'condo interior singapore',
  ],
}

export interface DiscoveredFirm {
  username: string
  displayName: string
  platform: 'instagram' | 'facebook'
  profileUrl: string
  bio: string | null
  followerCount: number | null
  postCount: number | null
  isVerified: boolean | null
  profilePicUrl: string | null
  confidenceScore: number  // How likely this is an SG interior design firm
  sourceHashtag: string | null
  discoveredAt: string
}

interface DiscoveryRun {
  runId: string
  status: 'started' | 'running' | 'completed' | 'failed'
  platform: 'instagram' | 'facebook'
  hashtagsSearched: number
  itemsFound: number
  discoveredAt: string
}

// Active discovery runs tracking
const activeRuns: DiscoveryRun[] = []

export function getActiveRuns(): DiscoveryRun[] {
  return activeRuns
}

/**
 * Start Instagram hashtag discovery
 */
export async function startInstagramDiscovery(
  hashtags?: string[],
  resultsPerHashtag: number = 20
): Promise<DiscoveryRun> {
  const tags = hashtags || SG_DISCOVERY_HASHTAGS.instagram.slice(0, 5) // Top 5 by default

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'discover-instagram',
        hashtags: tags,
        resultsPerHashtag,
      }),
    })

    const data = await response.json()

    const run: DiscoveryRun = {
      runId: data.runId || 'unknown',
      status: data.status === 'started' ? 'running' : 'failed',
      platform: 'instagram',
      hashtagsSearched: tags.length,
      itemsFound: 0,
      discoveredAt: new Date().toISOString(),
    }

    activeRuns.unshift(run)
    return run
  } catch (error) {
    const run: DiscoveryRun = {
      runId: 'error',
      status: 'failed',
      platform: 'instagram',
      hashtagsSearched: tags?.length || 0,
      itemsFound: 0,
      discoveredAt: new Date().toISOString(),
    }
    activeRuns.unshift(run)
    return run
  }
}

/**
 * Start Facebook page discovery
 */
export async function startFacebookDiscovery(
  searchTerms?: string[],
): Promise<DiscoveryRun> {
  const terms = searchTerms || SG_DISCOVERY_HASHTAGS.facebook.slice(0, 5)

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'discover-facebook',
        searchTerms: terms,
      }),
    })

    const data = await response.json()

    const run: DiscoveryRun = {
      runId: data.runId || 'unknown',
      status: data.status === 'started' ? 'running' : 'failed',
      platform: 'facebook',
      hashtagsSearched: terms.length,
      itemsFound: 0,
      discoveredAt: new Date().toISOString(),
    }

    activeRuns.unshift(run)
    return run
  } catch (error) {
    const run: DiscoveryRun = {
      runId: 'error',
      status: 'failed',
      platform: 'facebook',
      hashtagsSearched: 0,
      itemsFound: 0,
      discoveredAt: new Date().toISOString(),
    }
    activeRuns.unshift(run)
    return run
  }
}

/**
 * Check the status of a discovery run and get results
 */
export async function checkDiscoveryRun(runId: string): Promise<{
  status: string
  items: any[]
  itemCount: number
}> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-run', runId }),
    })

    const data = await response.json()
    return {
      status: data.status || 'unknown',
      items: data.items || [],
      itemCount: data.itemCount || 0,
    }
  } catch {
    return { status: 'error', items: [], itemCount: 0 }
  }
}

/**
 * Scrape Instagram profiles to get firm details
 */
export async function scrapeProfiles(usernames: string[]): Promise<string | null> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'scrape-profiles', usernames }),
    })

    const data = await response.json()
    return data.runId || null
  } catch {
    return null
  }
}

/**
 * Parse raw Apify Instagram hashtag results into DiscoveredFirm objects
 * Filters for accounts that are likely SG interior design firms
 */
export function parseInstagramResults(rawItems: any[], sourceHashtag: string): DiscoveredFirm[] {
  if (!Array.isArray(rawItems)) return []

  const firms: DiscoveredFirm[] = []
  const seenUsernames = new Set<string>()

  // Keywords that indicate an SG interior design firm
  const idKeywords = [
    'interior', 'design', 'renovation', 'reno', 'hdb', 'bto', 'condo',
    'home', 'decor', 'remodel', 'makeover', 'sg', 'singapore',
    'living', 'bedroom', 'kitchen', 'bathroom', 'wardrobe',
    'scandinavian', 'minimalist', 'japandi', 'modern',
    'contractor', 'builder', 'carpenter', 'package',
  ]

  const sgKeywords = ['sg', 'singapore', 'hdb', 'bto', 'condo', 'clementi', 'tampines', 'jurong', 'woodlands', 'punggol', 'sengkang']

  for (const item of rawItems) {
    const username = item.ownerUsername || item.username || ''
    const displayName = item.ownerFullName || item.fullName || ''
    const bio = item.ownerBio || item.biography || ''
    const combined = `${username} ${displayName} ${bio}`.toLowerCase()

    if (!username || seenUsernames.has(username.toLowerCase())) continue
    seenUsernames.add(username.toLowerCase())

    // Skip obviously personal accounts or very small accounts
    const followers = item.ownerFollowers || item.followersCount || 0
    if (followers > 0 && followers < 50) continue // Skip tiny accounts

    // Calculate confidence score
    let confidence = 0
    for (const kw of idKeywords) {
      if (combined.includes(kw)) confidence += 10
    }
    for (const kw of sgKeywords) {
      if (combined.includes(kw)) confidence += 15
    }

    // Boost for verified accounts
    if (item.ownerIsVerified || item.isVerified) confidence += 20

    // Boost for reasonable follower count (1K-500K typical for ID firms)
    if (followers >= 1000 && followers <= 500000) confidence += 10

    // Skip very low confidence results (unlikely to be ID firms)
    if (confidence < 20) continue

    firms.push({
      username,
      displayName: displayName || username,
      platform: 'instagram',
      profileUrl: `https://instagram.com/${username}`,
      bio: bio || null,
      followerCount: followers || null,
      postCount: item.ownerPostCount || item.postsCount || null,
      isVerified: item.ownerIsVerified || item.isVerified || null,
      profilePicUrl: item.ownerProfilePicUrl || item.profilePicUrl || null,
      confidenceScore: Math.min(100, confidence),
      sourceHashtag,
      discoveredAt: new Date().toISOString(),
    })
  }

  return firms.sort((a, b) => b.confidenceScore - a.confidenceScore)
}

/**
 * Parse raw Apify Facebook results into DiscoveredFirm objects
 */
export function parseFacebookResults(rawItems: any[], searchTerm: string): DiscoveredFirm[] {
  if (!Array.isArray(rawItems)) return []

  const firms: DiscoveredFirm[] = []
  const seenUsernames = new Set<string>()

  const idKeywords = ['interior', 'design', 'renovation', 'reno', 'hdb', 'bto', 'condo', 'home', 'decor', 'contractor', 'builder', 'package']
  const sgKeywords = ['sg', 'singapore', 'hdb', 'bto', 'condo']

  for (const item of rawItems) {
    const username = item.username || item.pageName || item.name || ''
    const displayName = item.name || item.pageName || ''
    const bio = item.about || item.description || item.bio || ''
    const combined = `${username} ${displayName} ${bio}`.toLowerCase()

    if (!username || seenUsernames.has(username.toLowerCase())) continue
    seenUsernames.add(username.toLowerCase())

    let confidence = 0
    for (const kw of idKeywords) {
      if (combined.includes(kw)) confidence += 10
    }
    for (const kw of sgKeywords) {
      if (combined.includes(kw)) confidence += 15
    }

    if (confidence < 20) continue

    firms.push({
      username,
      displayName: displayName || username,
      platform: 'facebook',
      profileUrl: item.url || `https://facebook.com/${username}`,
      bio: bio || null,
      followerCount: item.likesCount || item.followersCount || null,
      postCount: null,
      isVerified: item.verified || null,
      profilePicUrl: item.profilePicUrl || item.imageUrl || null,
      confidenceScore: Math.min(100, confidence),
      sourceHashtag: searchTerm,
      discoveredAt: new Date().toISOString(),
    })
  }

  return firms.sort((a, b) => b.confidenceScore - a.confidenceScore)
}

export type { DiscoveryRun }
