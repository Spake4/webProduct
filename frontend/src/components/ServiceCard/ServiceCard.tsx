import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Service } from '@/types'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  onClick?: () => void
  compact?: boolean
}

const categoryColors: Record<string, string> = {
  auto: 'from-orange-500/20 to-red-500/20 border-orange-500/20',
  logos: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/20',
  clothing: 'from-pink-500/20 to-rose-500/20 border-pink-500/20',
  interior: 'from-teal-500/20 to-cyan-500/20 border-teal-500/20',
  portrait: 'from-blue-500/20 to-indigo-500/20 border-blue-500/20',
  stylization: 'from-violet-500/20 to-purple-500/20 border-violet-500/20',
  utilities: 'from-green-500/20 to-emerald-500/20 border-green-500/20',
}

export const ServiceCard = ({ service, onClick, compact = false }: ServiceCardProps) => {
  const colorClass = categoryColors[service.category] ?? 'from-violet-500/20 to-blue-500/20 border-violet-500/20'

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-2xl border bg-gradient-to-br p-5',
        'transition-all duration-300 hover:shadow-glow group relative overflow-hidden',
        colorClass,
        compact ? 'p-4' : 'p-5'
      )}
    >
      {/* Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className={cn(
            'flex items-center justify-center rounded-xl',
            compact ? 'w-10 h-10 text-2xl' : 'w-12 h-12 text-3xl',
            'bg-white/10'
          )}>
            {service.icon}
          </div>
        </div>

        <div>
          <h3 className={cn('font-syne font-semibold text-white', compact ? 'text-sm' : 'text-base')}>
            {service.name}
          </h3>
          {!compact && (
            <p className="text-xs text-white/50 mt-1 line-clamp-2">{service.description}</p>
          )}
        </div>

        {!compact && (
          <div className="flex items-center gap-1 text-xs text-white/40 group-hover:text-white/70 transition-colors">
            <span>Попробовать</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
