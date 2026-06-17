import type { ReactNode } from 'react'
import { cn } from '../utils'

type Color = 'purple' | 'green' | 'yellow' | 'red' | 'blue' | 'gray'

interface BadgeProps {
  children: ReactNode
  color?: Color
  className?: string
}

const colorClasses: Record<Color, string> = {
  purple: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
  green: 'bg-green-500/20 text-green-300 border-green-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  gray: 'bg-white/10 text-gray-400 border-white/10',
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  )
}
