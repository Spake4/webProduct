import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUserTasks } from '@/api/tasks'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import type { TaskStatus } from '@/types'

const statusBadge: Record<TaskStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'violet' }> = {
  completed: { label: 'Готово', variant: 'success' },
  pending: { label: 'Ожидание', variant: 'warning' },
  processing: { label: 'Обработка', variant: 'violet' },
  failed: { label: 'Ошибка', variant: 'error' },
}

export const Profile = () => {
  const { user } = useAuthStore()
  const { data, isLoading } = useUserTasks()

  if (!user) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-white/40">Пожалуйста, войдите в систему</p>
      </div>
    )
  }

  const stats = [
    {
      icon: CheckCircle,
      label: 'Выполнено',
      value: data?.items.filter((t) => t.status === 'completed').length ?? 0,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      icon: Clock,
      label: 'В очереди',
      value: data?.items.filter((t) => t.status === 'pending' || t.status === 'processing').length ?? 0,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: XCircle,
      label: 'Ошибки',
      value: data?.items.filter((t) => t.status === 'failed').length ?? 0,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ]

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
          {user.email[0].toUpperCase()}
        </div>
        <div>
          <h1 className="font-syne font-bold text-2xl text-white">{user.email}</h1>
          <p className="text-white/40 text-sm">Участник с {formatDate(user.created_at)}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-white font-syne">{value}</p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Task history */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-syne font-semibold text-lg text-white mb-4">История задач</h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-white/30">
            Нет истории задач
          </div>
        ) : (
          <div className="space-y-2">
            {data?.items.map((task) => {
              const sb = statusBadge[task.status]
              return (
                <div
                  key={task.id}
                  className="glass-card rounded-xl p-4 flex items-center gap-4"
                >
                  {task.output_image_url || task.input_image_url ? (
                    <img
                      src={task.output_image_url ?? task.input_image_url}
                      alt="task"
                      className="w-12 h-12 rounded-lg object-cover bg-white/5 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {task.service?.name ?? task.service_id}
                    </p>
                    <p className="text-xs text-white/30">{formatDate(task.created_at)}</p>
                  </div>
                  <Badge variant={sb.variant}>{sb.label}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
