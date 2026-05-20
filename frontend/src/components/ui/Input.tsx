import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm text-white/70 font-medium">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl bg-[#16161f] border border-white/10',
            'text-white placeholder:text-white/30 text-sm',
            'focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30',
            'transition-colors duration-200',
            error && 'border-red-500/60',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
