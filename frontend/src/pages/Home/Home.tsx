import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Zap, Shield, Layers } from 'lucide-react'
import { ServiceCard } from '@/components/ServiceCard/ServiceCard'
import { Button } from '@/components/ui/Button'
import { useServices } from '@/api/services'
import { useEditorStore } from '@/stores/editorStore'
import type { Service } from '@/types'

const features = [
  { icon: Zap,    title: 'Быстрая обработка', desc: 'Результат за 30-60 секунд' },
  { icon: Shield, title: 'Безопасно',          desc: 'Ваши изображения защищены' },
  { icon: Layers, title: '20+ инструментов',   desc: 'AI-инструменты для любых задач' },
]

const L = (slug: string) => ({
  before: `/previews/${slug}-before.jpg`,
  after:  `/previews/${slug}-after.jpg`,
})

const SERVICE_PREVIEWS: Record<string, { before: string; after: string; objectPosition?: string }> = {
  'car-recolor':       L('car-recolor'),
  'photo-enhancement': L('photo-enhancement'),
  'anime-style':       { ...L('anime-style'), objectPosition: 'top' },
  'oil-painting':      L('oil-painting'),
  'pencil-sketch':     { ...L('pencil-sketch'), objectPosition: 'top' },
  'watercolor':        L('watercolor'),
  'portrait-enhance':  { ...L('portrait-enhance'), objectPosition: 'top' },
  'background-remove': L('background-remove'),
  'background-add':    { ...L('background-add'), objectPosition: 'top' },
  'background-replace': { ...L('background-replace'), objectPosition: 'top' },
}

// Showcase strip — flows endlessly under the hero
const MARQUEE = [
  'oil-painting-after', 'anime-style-after', 'watercolor-after',
  'car-recolor-after', 'portrait-enhance-after', 'photo-enhancement-after', 'pencil-sketch-after',
]

export const Home = () => {
  const navigate = useNavigate()
  const { data: services = [] } = useServices()
  const setSelectedService = useEditorStore((s) => s.setSelectedService)

  const handleServiceClick = (service: Service) => {
    setSelectedService(service)
    navigate('/editor')
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-12 overflow-hidden">
        {/* floating ambient orbs (violet identity) */}
        <div className="absolute -top-20 left-10 w-[480px] h-[480px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-blue-600/12 rounded-full blur-[120px] pointer-events-none animate-float" />

        <div className="relative max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-syne font-extrabold text-white leading-[1.08] mb-5 tracking-tight"
          >
            Редактируй изображения
            <br />
            <span className="gradient-text-animated text-glow">с помощью AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/50 text-lg mb-8 max-w-xl leading-relaxed"
          >
            Перекрасить авто, сменить интерьер, примерить одежду — всё это за несколько секунд с помощью нейросетей
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            <Button size="lg" onClick={() => navigate('/editor')} className="gap-2 shadow-glow-lg">
              <Sparkles size={18} />
              Начать редактирование
              <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/gallery')}>
              Галерея работ
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Showcase marquee */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
      >
        <div className="marquee-track gap-4">
          {[...MARQUEE, ...MARQUEE].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="relative w-52 h-32 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 shadow-card"
            >
              <img
                src={`/previews/${name}.jpg`}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          ))}
        </div>
      </motion.section>

      {/* Feature strip */}
      <section className="px-6 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-violet-500/25 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-violet-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-white/40 mt-0.5">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="text-xs font-semibold tracking-[0.25em] text-violet-400 uppercase">Инструменты</span>
          <h2 className="font-syne font-bold text-2xl lg:text-3xl text-white mt-2">
            Доступные <span className="gradient-text">сервисы</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {services.map((service, i) => {
            const preview = SERVICE_PREVIEWS[service.slug]
            return (
              <div
                key={service.id}
                className="animate-fade-up"
                style={{ animationDelay: `${(i % 4) * 60}ms` }}
              >
                <ServiceCard
                  service={service}
                  onClick={() => handleServiceClick(service)}
                  beforeImage={preview?.before}
                  afterImage={preview?.after}
                  objectPosition={preview?.objectPosition}
                />
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
