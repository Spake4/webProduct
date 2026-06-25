import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import type { TaskStatus } from '@/types'
import { cn } from '@/lib/utils'

interface ProgressTrackerProps {
  status: TaskStatus
  progress: number
  className?: string
}

const statusConfig = {
  pending: {
    label: 'Ожидание обработки',
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  processing: {
    label: 'Обработка изображения...',
    icon: Loader2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    spin: true,
  },
  completed: {
    label: 'Готово!',
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  failed: {
    label: 'Ошибка обработки',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
}

const steps = [
  { key: 'upload', label: 'Загрузка',  threshold: 15 },
  { key: 'queue',  label: 'Очередь',   threshold: 25 },
  { key: 'ai',     label: 'ComfyUI',   threshold: 90 },
  { key: 'saving', label: 'Готово',    threshold: 100 },
]

const stepNum: Record<string, string> = { upload: '1', queue: '2', ai: '3', saving: '4' }

export const ProgressTracker = ({ status, progress, className }: ProgressTrackerProps) => {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayProgress = status === 'completed' ? 100 : progress

  return (
    <div className={cn('glass-card rounded-2xl p-5 space-y-5', className)}>
      {/* Status indicator */}
      <div className={cn('flex items-center gap-3 rounded-xl px-4 py-3', config.bg)}>
        <Icon
          size={20}
          className={cn(config.color, 'spin' in config && config.spin ? 'animate-spin' : '')}
        />
        <span className={cn('font-medium text-sm', config.color)}>{config.label}</span>
        {status === 'processing' && (
          <span className="ml-auto text-xs text-white/30 font-mono">{displayProgress}%</span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>Прогресс</span>
          <span>{displayProgress}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            className={cn(
              'h-full rounded-full',
              status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-violet-600 to-blue-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          {(status === 'pending' || status === 'processing') && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ width: '50%' }}
            />
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step) => {
          const isDone =
            status === 'completed' ||
            (status !== 'failed' && displayProgress >= step.threshold)
          const isActive =
            status !== 'completed' &&
            status !== 'failed' &&
            displayProgress >= step.threshold - 15 &&
            displayProgress < step.threshold
          const isFailed = status === 'failed'

          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isDone ? 'bg-green-500/20 text-green-400' :
                  isActive ? 'bg-violet-500/30 text-violet-300 ring-2 ring-violet-500/50' :
                  isFailed ? 'bg-red-500/20 text-red-400' :
                  'bg-white/5 text-white/20'
                )}
              >
                {isDone ? '✓' : stepNum[step.key]}
              </div>
              <span className={cn(
                'text-xs',
                isDone || isActive ? 'text-white/60' : 'text-white/20'
              )}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
