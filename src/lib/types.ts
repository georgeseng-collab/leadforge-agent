// ===== Enums =====

export type Platform = 'instagram' | 'facebook' | 'tiktok'
export type Tier = 'tier1' | 'tier2' | 'tier3'
export type PipelineStage = 'new' | 'contacted' | 'responded' | 'appointment_set' | 'closed_won' | 'closed_lost'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'sent' | 'failed'
export type AgentType = 'scout' | 'qualifier' | 'dm_sender' | 'contact_extractor' | 'keyword_evolver' | 'appointment_booker'
export type AgentStatus = 'running' | 'completed' | 'failed' | 'pending'
export type KeywordCategory = 'intent_signal' | 'hashtag' | 'budget_signal' | 'location_signal' | 'style_preference' | 'urgency_signal' | 'negative_signal'
export type DiscoveryMethod = 'auto_discovered' | 'manual' | 'keyword_evolved'
export type AppointmentStatus = 'confirmed' | 'pending' | 'rescheduled' | 'cancelled' | 'completed'
export type TrendType = 'viral_post' | 'emerging_hashtag' | 'competitor_surge' | 'market_shift'
export type ConversationDirection = 'inbound' | 'outbound'

// ===== Database Row Types =====

export interface CompetitorSource {
  id: string
  platform: Platform
  platform_id: string | null
  username: string
  display_name: string | null
  bio: string | null
  follower_count: number | null
  post_count: number | null
  profile_pic_url: string | null
  is_active: boolean
  discovery_method: string | null
  discovery_source: string | null
  avg_comments_per_post: number | null
  avg_likes_per_post: number | null
  last_scraped_at: string | null
  scrape_frequency_minutes: number | null
  priority_score: number | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface AdaptiveKeyword {
  id: string
  keyword: string
  category: KeywordCategory
  intent_weight: number
  frequency_count: number
  conversion_rate: number | null
  source_platform: Platform | null
  discovery_method: DiscoveryMethod
  is_active: boolean
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface RawCommenter {
  id: string
  platform: Platform
  platform_user_id: string | null
  username: string
  display_name: string | null
  source_comment_text: string | null
  source_post_url: string | null
  source_competitor_id: string | null
  source_competitor_username: string | null
  is_processed: boolean
  processing_hash: string | null
  scraped_at: string | null
  created_at: string
}

export interface QualifiedLead {
  id: string
  raw_commenter_id: string | null
  platform: Platform
  username: string
  display_name: string | null
  priority_tier: Tier
  pipeline_stage: PipelineStage
  qualification_score: number
  phone: string | null
  email: string | null
  whatsapp: string | null
  contact_extracted: boolean
  profile_url: string | null
  profile_pic_url: string | null
  bio: string | null
  follower_count: number | null
  intent_signals: string[] | null
  budget_signals: string[] | null
  location_signals: string[] | null
  style_preferences: string[] | null
  urgency_level: string | null
  estimated_budget: string | null
  property_type: string | null
  last_dm_at: string | null
  dm_count: number
  response_count: number
  appointment_date: string | null
  appointment_status: AppointmentStatus | null
  notes: string | null
  tags: string[] | null
  competitor_source_id: string | null
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  lead_id: string
  platform: Platform
  direction: ConversationDirection
  message_text: string
  ai_analysis: string | null
  intent_detected: string | null
  contact_info_extracted: string | null
  is_ai_generated: boolean
  sent_at: string
  created_at: string
}

export interface MessageQueue {
  id: string
  lead_id: string | null
  message_text: string
  approval_status: string
  send_status: string | null
  priority: number | null
  tier: string | null
  scheduled_send_at: string | null
  sent_at: string | null
  error_message: string | null
  retry_count: number | null
  created_at: string
  updated_at: string
}

export interface AgentRun {
  id: string
  agent_type: AgentType
  status: AgentStatus
  items_processed: number
  items_failed: number
  input_summary: string | null
  output_summary: string | null
  error_message: string | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  created_at: string
}

export interface TrendSignal {
  id: string
  trend_type: TrendType
  platform: Platform | null
  signal_text: string
  signal_url: string | null
  frequency: number
  velocity: number | null
  relevance_score: number
  is_actionable: boolean
  metadata: Record<string, unknown> | null
  detected_at: string
  created_at: string
}

export interface SuccessMetric {
  id: string
  metric_type: string
  metric_key: string
  metric_value: number
  context: Record<string, unknown> | null
  recorded_at: string
  created_at: string
}

// ===== Insert Types =====

export type CompetitorSourceInsert = Partial<Omit<CompetitorSource, 'id' | 'created_at' | 'updated_at'>> & {
  platform: Platform
  username: string
  is_active: boolean
}
export type AdaptiveKeywordInsert = Omit<AdaptiveKeyword, 'id' | 'created_at' | 'updated_at'>
export type RawCommenterInsert = Omit<RawCommenter, 'id' | 'created_at'>
export type QualifiedLeadInsert = Omit<QualifiedLead, 'id' | 'created_at' | 'updated_at'>
export type ConversationInsert = Omit<Conversation, 'id' | 'created_at'>
export type MessageQueueInsert = Omit<MessageQueue, 'id' | 'created_at' | 'updated_at'>
export type AgentRunInsert = Omit<AgentRun, 'id' | 'created_at'>
export type TrendSignalInsert = Omit<TrendSignal, 'id' | 'created_at'>
export type SuccessMetricInsert = Omit<SuccessMetric, 'id' | 'created_at'>

// ===== Update Types =====

export type CompetitorSourceUpdate = Partial<Omit<CompetitorSource, 'id' | 'created_at'>>
export type QualifiedLeadUpdate = Partial<Omit<QualifiedLead, 'id' | 'created_at'>>
export type MessageQueueUpdate = Partial<Omit<MessageQueue, 'id' | 'created_at'>>

// ===== Dashboard Stats =====

export interface DashboardStats {
  totalLeads: number
  tier1Count: number
  appointmentsToday: number
  conversionRate: number
}

// ===== Pipeline Stage Config =====

export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: '#6b7280' },
  { key: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { key: 'responded', label: 'Responded', color: '#8b5cf6' },
  { key: 'appointment_set', label: 'Appointment Set', color: '#f59e0b' },
  { key: 'closed_won', label: 'Closed Won', color: '#10b981' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#ef4444' },
]

export const TIER_CONFIG: Record<Tier, { label: string; color: string; bgColor: string; borderColor: string }> = {
  tier1: { label: 'Hot', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  tier2: { label: 'Warm', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' },
  tier3: { label: 'Nurture', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)' },
}

export const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bgColor: string; borderColor: string }> = {
  instagram: { label: 'Instagram', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.3)' },
  facebook: { label: 'Facebook', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.15)', borderColor: 'rgba(37, 99, 235, 0.3)' },
  tiktok: { label: 'TikTok', color: '#e2e8f0', bgColor: 'rgba(226, 232, 240, 0.1)', borderColor: 'rgba(226, 232, 240, 0.2)' },
}

export const AGENT_TYPE_CONFIG: Record<AgentType, { label: string; description: string }> = {
  scout: { label: 'Scout Agent', description: 'Scrapes competitor pages for new commenters' },
  qualifier: { label: 'Qualifier Agent', description: 'AI-qualifies raw commenters into leads' },
  dm_sender: { label: 'DM Sender Agent', description: 'Sends personalized DMs to qualified leads' },
  contact_extractor: { label: 'Contact Extractor', description: 'Extracts phone/email/WhatsApp from conversations' },
  keyword_evolver: { label: 'Keyword Evolver', description: 'Discovers new keywords from successful conversions' },
  appointment_booker: { label: 'Appointment Booker', description: 'Auto-books appointments via Cal.com' },
}
