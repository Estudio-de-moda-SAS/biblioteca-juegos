import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-lg shadow-brand-500/25',
  secondary:
    'bg-surface-100 hover:bg-surface-200 text-gray-100 border border-white/10',
  ghost: 'hover:bg-white/10 text-gray-300 hover:text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25',
  outline:
    'border border-brand-500 text-brand-400 hover:bg-brand-500/10',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-surface',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
