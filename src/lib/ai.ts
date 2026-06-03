const OPENAI_BASE = 'https://api.openai.com/v1'

function getOpenAIKey(): string {
  return import.meta.env.VITE_OPENAI_API_KEY || ''
}

async function openAIChat(messages: Array<{ role: string; content: string }>, temperature: number = 0.7) {
  const key = getOpenAIKey()
  if (!key) {
    console.warn('OpenAI API key not configured')
    return null
  }

  const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || null
}

export interface QualifyLeadInput {
  username: string
  displayName: string | null
  bio: string | null
  commentText: string
  platform: string
  postCaption: string | null
  keywords: string[]
}

export interface QualifyLeadOutput {
  isQualified: boolean
  tier: 'tier1' | 'tier2' | 'tier3'
  score: number
  intentSignals: string[]
  budgetSignals: string[]
  locationSignals: string[]
  stylePreferences: string[]
  urgencyLevel: 'high' | 'medium' | 'low' | 'none'
  estimatedBudget: string | null
  propertyType: string | null
  reasoning: string
}

export async function qualifyLead(input: QualifyLeadInput): Promise<QualifyLeadOutput | null> {
  const result = await openAIChat([
    {
      role: 'system',
      content: `You are an AI lead qualifier for a Singapore interior design firm. Analyze the social media commenter and determine if they are a potential lead.

Score 0-100 based on:
- Intent signals (renovation, remodeling, BTO, condo, HDB, interior design, home makeover)
- Budget signals (budget, affordable, renovation package, quote)
- Location signals (Singapore, SGP, BTO, HDB, condo, Clementi, Tampines, etc.)
- Style preferences (minimalist, Scandinavian, modern, Japandi, industrial)
- Urgency (moving in soon, keys collected, renovation starting)

Tier classification:
- tier1 (score 80+): HOT lead with strong intent + budget + location + urgency
- tier2 (score 60-79): WARM lead with some intent signals
- tier3 (score 40-59): NURTURE lead with weak signals

Return JSON only:
{
  "isQualified": boolean,
  "tier": "tier1"|"tier2"|"tier3",
  "score": number,
  "intentSignals": string[],
  "budgetSignals": string[],
  "locationSignals": string[],
  "stylePreferences": string[],
  "urgencyLevel": "high"|"medium"|"low"|"none",
  "estimatedBudget": string|null,
  "propertyType": string|null,
  "reasoning": string
}`,
    },
    {
      role: 'user',
      content: `Analyze this commenter:
Username: ${input.username}
Display Name: ${input.displayName || 'Unknown'}
Bio: ${input.bio || 'Not available'}
Comment: "${input.commentText}"
Platform: ${input.platform}
Post Caption: ${input.postCaption || 'Not available'}
Active Keywords: ${input.keywords.join(', ')}`,
    },
  ], 0.3)

  if (!result) return null
  try {
    return JSON.parse(result)
  } catch {
    console.error('Failed to parse qualify lead response')
    return null
  }
}

export interface GenerateMessageInput {
  leadName: string
  platform: string
  tier: string
  intentSignals: string[]
  stylePreferences: string[]
  propertyType: string | null
  urgencyLevel: string
  commentText: string
  previousMessages: string[]
}

export async function generateMessage(input: GenerateMessageInput): Promise<string | null> {
  return openAIChat([
    {
      role: 'system',
      content: `You are a friendly interior design consultant in Singapore. Generate a personalized DM that:
1. References their specific interest (from intent signals and comment)
2. Mentions relevant style if available
3. Offers value (free consultation, design tips, portfolio relevant to them)
4. Is warm but professional
5. Keeps it concise (under 150 words)
6. ${input.platform === 'instagram' ? 'Uses 1-2 emojis max' : input.platform === 'tiktok' ? 'Is casual and trendy' : 'Is professional but warm'}

Do NOT be pushy or salesy. Build rapport first. This is for Singapore market.`,
    },
    {
      role: 'user',
      content: `Lead: ${input.leadName}
Platform: ${input.platform}
Tier: ${input.tier}
Interest: ${input.intentSignals.join(', ')}
Style: ${input.stylePreferences.join(', ') || 'Unknown'}
Property: ${input.propertyType || 'Unknown'}
Urgency: ${input.urgencyLevel}
Their Comment: "${input.commentText}"
Previous messages: ${input.previousMessages.length > 0 ? input.previousMessages.join(' | ') : 'None yet'}`,
    },
  ], 0.8)
}

export async function extractContactInfo(conversationText: string): Promise<{
  phone: string | null
  email: string | null
  whatsapp: string | null
} | null> {
  const result = await openAIChat([
    {
      role: 'system',
      content: `Extract contact information from this conversation. Look for:
- Phone numbers (Singapore format: +65, 8 digits, or 9xxx xxxx)
- Email addresses
- WhatsApp numbers

Return JSON only:
{
  "phone": string|null,
  "email": string|null,
  "whatsapp": string|null
}`,
    },
    {
      role: 'user',
      content: conversationText,
    },
  ], 0.1)

  if (!result) return null
  try {
    return JSON.parse(result)
  } catch {
    return null
  }
}

export async function classifyIntent(messageText: string): Promise<{
  intent: string
  confidence: number
  isPositiveResponse: boolean
} | null> {
  const result = await openAIChat([
    {
      role: 'system',
      content: `Classify the intent of this DM response from a potential interior design client.

Return JSON only:
{
  "intent": "interested"|"not_interested"|"maybe_later"|"asking_question"|"providing_contact"|"spam"|"other",
  "confidence": 0-1,
  "isPositiveResponse": boolean
}`,
    },
    {
      role: 'user',
      content: messageText,
    },
  ], 0.2)

  if (!result) return null
  try {
    return JSON.parse(result)
  } catch {
    return null
  }
}

export async function generateFollowUp(
  leadName: string,
  previousMessages: string[],
  lastResponse: string,
  intentClassification: string
): Promise<string | null> {
  return openAIChat([
    {
      role: 'system',
      content: `You are a friendly interior design consultant in Singapore. Generate a follow-up DM based on the lead's last response.
Keep it concise (under 100 words). Be helpful, not pushy.
If they asked a question, answer it. If they're interested, suggest next steps.
If they said maybe later, acknowledge and leave the door open.`,
    },
    {
      role: 'user',
      content: `Lead: ${leadName}
Intent: ${intentClassification}
Last message from them: "${lastResponse}"
Conversation so far: ${previousMessages.join(' → ')}`,
    },
  ], 0.7)
}
