import type { Tier } from '@/lib/types'
import { TIER_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TierBadgeProps {
  tier: Tier
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function TierBadge({ tier, size = 'sm', showLabel = true, className }: TierBadgeProps) {
  const config = TIER_CONFIG[tier]

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border whitespace-nowrap',
        sizeClasses[size],
        className
      )}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      {showLabel ? config.label : null}
    </span>
  )
}
