import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../utils'

interface FieldWrapperProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
}

export function FieldWrapper({ label, htmlFor, hint, error, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

const inputBase =
  'w-full rounded-lg border border-white/10 bg-surface-100 px-3 py-2 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <FieldWrapper label={label} htmlFor={fieldId} hint={hint} error={error}>
      <input id={fieldId} className={cn(inputBase, className)} {...props} />
    </FieldWrapper>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <FieldWrapper label={label} htmlFor={fieldId} hint={hint} error={error}>
      <textarea
        id={fieldId}
        rows={3}
        className={cn(inputBase, 'resize-none', className)}
        {...props}
      />
    </FieldWrapper>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, hint, error, options, className, id, ...props }: SelectProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <FieldWrapper label={label} htmlFor={fieldId} hint={hint} error={error}>
      <select id={fieldId} className={cn(inputBase, 'cursor-pointer', className)} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
}

export function ColorInput({ label, value, onChange, hint }: ColorInputProps) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputBase, 'flex-1 font-mono uppercase')}
          maxLength={7}
          placeholder="#000000"
        />
      </div>
    </FieldWrapper>
  )
}

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
}

export function Toggle({ label, checked, onChange, hint }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-300">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50',
          checked ? 'bg-brand-500' : 'bg-white/20'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'left-[1.375rem]' : 'left-0.5'
          )}
        />
      </button>
    </div>
  )
}
