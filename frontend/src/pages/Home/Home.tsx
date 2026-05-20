import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Zap, Shield, Layers } from 'lucide-react'
import { ServiceCard } from '@/components/ServiceCard/ServiceCard'
import { Button } from '@/components/ui/Button'
import { useServices } from '@/api/services'
import { useEditorStore } from '@/stores/editorStore'
import type { Service } from '@/types'

const categoryLabels: Record<string, string> = {
  auto: 'Авто',
  logos: 'Логотипы',
  clothing: 'Одежда',
  interior: 'Интерьер',
  portrait: 'Портрет',
  stylization: 'Стилизация',
  utilities: 'Утилиты',
}

const features = [
  { icon: Zap, title: 'Быстрая обработка', desc: 'Результат за 30-60 секунд' },
  { icon: Shield, title: 'Безопасно', desc: 'Ваши изображения защищены' },
  { icon: Layers, title: '20+ инструментов', desc: 'AI-инструменты для любых задач' },
]

export const Home = () => {
  const navigate = useNavigate()
  const { data: services = [] } = useServices()
  const setSelectedService = useEditorStore((s) => s.setSelectedService)

  const handleServiceClick = (service: Service) => {
    setSelectedService(service)
    navigate('/editor')
  }

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-blue-900/20 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6"
          >
            <Sparkles size={14} className="text-violet-400" />
            <span className="text-xs text-violet-300 font-medium">Powered by ComfyUI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-syne font-bold text-white leading-tight mb-5"
          >
            Редактируй изображения
            <br />
            <span className="gradient-text">с помощью AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/50 text-lg mb-8 max-w-xl"
          >
            Перекрасить авто, сменить интерьер, примерить одежду — всё это за несколько секунд с помощью нейросетей
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex gap-3"
          >
            <Button size="lg" onClick={() => navigate('/editor')} className="gap-2">
              Начать редактирование
              <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/gallery')}>
              Галерея работ
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-6 mt-10"
          >
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/80">{title}</p>
                  <p className="text-xs text-white/30">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="px-6 py-10">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="font-syne font-bold text-2xl text-white mb-8"
        >
          Доступные сервисы
        </motion.h2>

        <div className="space-y-10">
          {Object.entries(grouped).map(([category, items], catIdx) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.05 }}
            >
              <h3 className="text-sm font-medium text-white/40 mb-4 uppercase tracking-wider">
                {categoryLabels[category] ?? category}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {items.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onClick={() => handleServiceClick(service)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
