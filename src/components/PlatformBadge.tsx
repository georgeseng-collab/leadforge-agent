import type { Platform } from '@/lib/types'
import { PLATFORM_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Camera, Globe } from 'lucide-react'

interface PlatformBadgeProps {
  platform: Platform
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.2a8.16 8.16 0 005.58 2.2V12a4.83 4.83 0 01-3.77-1.54V6.69h3.77z" />
    </svg>
  )
}

export default function PlatformBadge({ platform, size = 'sm', showLabel = true, className }: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform]

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'

  const Icon = platform === 'instagram' ? Camera : platform === 'facebook' ? Globe : TikTokIcon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border whitespace-nowrap',
        textSize,
        padding,
        className
      )}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      <Icon className={iconSize} />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}
