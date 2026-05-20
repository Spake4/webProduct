import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import type { TaskStatus } from '@/types'
import { cn } from '@/lib/utils'

interface ProgressTrackerProps {
  status: TaskStatus
  className?: string
}

const statusConfig = {
  pending: {
    label: 'Ожидание обработки',
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    progress: 15,
  },
  processing: {
    label: 'Обработка изображения...',
    icon: Loader2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    progress: 60,
    spin: true,
  },
  completed: {
    label: 'Готово!',
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    progress: 100,
  },
  failed: {
    label: 'Ошибка обработки',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    progress: 100,
  },
}

const steps = [
  { key: 'upload', label: 'Загрузка' },
  { key: 'queue', label: 'Очередь' },
  { key: 'processing', label: 'ComfyUI' },
  { key: 'saving', label: 'Сохранение' },
]

const stepByStatus: Record<TaskStatus, number> = {
  pending: 1,
  processing: 2,
  completed: 4,
  failed: 4,
}

export const ProgressTracker = ({ status, className }: ProgressTrackerProps) => {
  const config = statusConfig[status]
  const Icon = config.icon
  const currentStep = stepByStatus[status]

  return (
    <div className={cn('glass-card rounded-2xl p-5 space-y-5', className)}>
      {/* Status indicator */}
      <div className={cn('flex items-center gap-3 rounded-xl px-4 py-3', config.bg)}>
        <Icon
          size={20}
          className={cn(config.color, 'spin' in config && config.spin && 'animate-spin')}
        />
        <span className={cn('font-medium text-sm', config.color)}>{config.label}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>Прогресс</span>
          <span>{config.progress}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            className={cn(
              'h-full rounded-full',
              status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-violet-600 to-blue-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${config.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* Shimmer overlay while active */}
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
        {steps.map((step, idx) => {
          const stepNum = idx + 1
          const isDone = stepNum < currentStep || status === 'completed'
          const isActive = stepNum === currentStep && status !== 'completed' && status !== 'failed'
          const isFailed = status === 'failed' && stepNum === currentStep

          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isDone && 'bg-green-500/20 text-green-400',
                  isActive && 'bg-violet-500/30 text-violet-300 ring-2 ring-violet-500/50',
                  isFailed && 'bg-red-500/20 text-red-400',
                  !isDone && !isActive && !isFailed && 'bg-white/5 text-white/20'
                )}
              >
                {isDone ? '✓' : stepNum}
              </div>
              <span className={cn(
                'text-xs',
                (isDone || isActive) ? 'text-white/60' : 'text-white/20'
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
