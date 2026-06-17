import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  glass?: boolean
}

export function Card({ children, hover = false, glass = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-surface-50 p-5',
        hover && 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10',
        glass && 'backdrop-blur-sm bg-white/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
