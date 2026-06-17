import { cn } from '../utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-brand-300 border-t-transparent',
        sizes[size],
        className
      )}
    />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <Spinner size="lg" />
    </div>
  )
}
