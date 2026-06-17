import { Check, Copy } from 'lucide-react'
import { useClipboard } from '../hooks'
import { Button } from './Button'

interface JsonViewerProps {
  value: string
  title?: string
}

export function JsonViewer({ value, title = 'Configuración JSON' }: JsonViewerProps) {
  const { copy, copied } = useClipboard()

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-surface-100 px-4 py-2.5">
        <span className="text-xs font-medium text-gray-400">{title}</span>
        <Button
          variant="ghost"
          size="sm"
          icon={copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          onClick={() => copy(value)}
          className="text-xs"
        >
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto bg-black/40 p-4 text-xs leading-relaxed text-green-300">
        <code>{value}</code>
      </pre>
    </div>
  )
}
