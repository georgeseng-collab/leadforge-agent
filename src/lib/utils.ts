import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Tier, Platform } from './types'
import { TIER_CONFIG, PLATFORM_CONFIG } from './types'
import { formatDistanceToNow, format, isToday, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return '—'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+65 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
  }
  if (cleaned.length === 8) {
    return `+65 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
  }
  return phone
}

export function formatTier(tier: Tier): string {
  return TIER_CONFIG[tier].label
}

export function formatPlatform(platform: Platform): string {
  return PLATFORM_CONFIG[platform].label
}

export function timeAgo(date: string): string {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function formatDate(date: string): string {
  try {
    const d = parseISO(date)
    if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`
    return format(d, 'MMM d, h:mm a')
  } catch {
    return '—'
  }
}

export function formatFullDate(date: string): string {
  try {
    return format(parseISO(date), 'EEEE, MMM d, yyyy · h:mm a')
  } catch {
    return '—'
  }
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

export function scoreToColor(score: number): string {
  if (score >= 80) return '#ef4444'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#3b82f6'
  return '#6b7280'
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

export function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.8) return { label: 'High', color: '#10b981' }
  if (confidence >= 0.5) return { label: 'Medium', color: '#f59e0b' }
  return { label: 'Low', color: '#ef4444' }
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`)
}
