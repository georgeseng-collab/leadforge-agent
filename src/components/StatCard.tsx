import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  iconColor?: string
  iconBgColor?: string
  className?: string
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  iconColor = '#10b981',
  iconBgColor = 'rgba(16, 185, 129, 0.15)',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-[#111113] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5',
              trend.value > 0
                ? 'text-emerald-400 bg-emerald-500/10'
                : trend.value < 0
                  ? 'text-red-400 bg-red-500/10'
                  : 'text-gray-400 bg-gray-800'
            )}
          >
            {trend.value > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend.value < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  )
}
