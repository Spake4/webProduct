import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export const Card = ({ className, glow, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-5 transition-all duration-300',
        glow && 'hover:shadow-glow hover:border-violet-500/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
