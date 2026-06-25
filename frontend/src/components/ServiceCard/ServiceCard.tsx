import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { Service } from '@/types'
import { cn } from '@/lib/utils'
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider/BeforeAfterSlider'

interface ServiceCardProps {
  service: Service
  onClick?: () => void
  compact?: boolean
  beforeImage?: string
  afterImage?: string
  objectPosition?: string
}

type LucideIconComponent = React.ComponentType<LucideProps>

function ServiceIcon({ name, size }: { name: string; size: number }) {
  const Icon = (LucideIcons as Record<string, unknown>)[name] as LucideIconComponent | undefined
  if (Icon) return <Icon size={size} />
  return <span style={{ fontSize: size }}>{name}</span>
}

export const ServiceCard = ({ service, onClick, compact = false, beforeImage, afterImage, objectPosition }: ServiceCardProps) => {
  const hasPreview  = !compact && beforeImage && afterImage

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseMove={handleMove}
      className={cn(
        'cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.025]',
        'transition-all duration-300 group relative overflow-hidden spotlight',
        'hover:border-violet-500/40 hover:shadow-[0_0_34px_-4px_rgba(124,58,237,0.45)]',
        compact ? 'p-4' : 'p-0',
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/25 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Before/After preview */}
      {hasPreview && (
        <BeforeAfterSlider
          before={beforeImage!}
          after={afterImage!}
          className="w-full aspect-square rounded-t-2xl"
          objectPosition={objectPosition}
        />
      )}

      <div className={cn('relative z-10 flex flex-col gap-2', compact ? '' : 'p-4', hasPreview ? 'pt-3' : '')}>
        {!hasPreview && (
          <div className="flex items-start justify-between">
            <div className={cn(
              'flex items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300',
              'group-hover:bg-violet-500/20 group-hover:border-violet-500/40 transition-colors',
              compact ? 'w-10 h-10' : 'w-12 h-12',
            )}>
              <ServiceIcon name={service.icon} size={compact ? 18 : 22} />
            </div>
          </div>
        )}

        <div>
          <h3 className={cn('font-syne font-semibold text-white tracking-tight', compact ? 'text-sm' : 'text-base')}>
            {service.name}
          </h3>
          {!compact && (
            <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">{service.description}</p>
          )}
        </div>

        {!compact && (
          <div className="flex items-center gap-1 text-xs text-white/40 group-hover:text-white/70 transition-colors mt-1">
            <span>Попробовать</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
