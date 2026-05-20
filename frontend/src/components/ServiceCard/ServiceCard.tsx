import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { Service } from '@/types'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  onClick?: () => void
  compact?: boolean
}

const categoryColors: Record<string, string> = {
  auto:        'from-orange-500/20 to-red-500/20    border-orange-500/30',
  logos:       'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  clothing:    'from-pink-500/20   to-rose-500/20   border-pink-500/30',
  interior:    'from-teal-500/20   to-cyan-500/20   border-teal-500/30',
  portrait:    'from-blue-500/20   to-indigo-500/20 border-blue-500/30',
  stylize:     'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30',
  stylization: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30',
  utility:     'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
  utilities:   'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
}

const categoryGlow: Record<string, string> = {
  auto:        'group-hover:shadow-[0_0_24px_rgba(249,115,22,0.25)]',
  logos:       'group-hover:shadow-[0_0_24px_rgba(234,179,8,0.25)]',
  clothing:    'group-hover:shadow-[0_0_24px_rgba(236,72,153,0.25)]',
  interior:    'group-hover:shadow-[0_0_24px_rgba(20,184,166,0.25)]',
  portrait:    'group-hover:shadow-[0_0_24px_rgba(59,130,246,0.25)]',
  stylize:     'group-hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]',
  stylization: 'group-hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]',
  utility:     'group-hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]',
  utilities:   'group-hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]',
}

const categoryIconColor: Record<string, string> = {
  auto:        'text-orange-400',
  logos:       'text-yellow-400',
  clothing:    'text-pink-400',
  interior:    'text-teal-400',
  portrait:    'text-blue-400',
  stylize:     'text-violet-400',
  stylization: 'text-violet-400',
  utility:     'text-emerald-400',
  utilities:   'text-emerald-400',
}

type LucideIconComponent = React.ComponentType<LucideProps>

function ServiceIcon({ name, size }: { name: string; size: number }) {
  const Icon = (LucideIcons as Record<string, unknown>)[name] as LucideIconComponent | undefined
  if (Icon) return <Icon size={size} />
  return <span style={{ fontSize: size }}>{name}</span>
}

export const ServiceCard = ({ service, onClick, compact = false }: ServiceCardProps) => {
  const colorClass  = categoryColors[service.category]   ?? 'from-violet-500/20 to-blue-500/20 border-violet-500/30'
  const glowClass   = categoryGlow[service.category]     ?? 'group-hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]'
  const iconColor   = categoryIconColor[service.category] ?? 'text-violet-400'

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-2xl border bg-gradient-to-br',
        'transition-all duration-300 group relative overflow-hidden',
        colorClass,
        glowClass,
        compact ? 'p-4' : 'p-5'
      )}
    >
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className={cn(
            'flex items-center justify-center rounded-xl bg-black/30 backdrop-blur-sm border border-white/10',
            compact ? 'w-10 h-10' : 'w-12 h-12',
            iconColor,
          )}>
            <ServiceIcon name={service.icon} size={compact ? 18 : 22} />
          </div>
        </div>

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
