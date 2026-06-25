import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight, Pipette } from 'lucide-react'
import { ImageUploader } from '@/components/ImageUploader/ImageUploader'
import { ResultViewer } from '@/components/ResultViewer/ResultViewer'
import { ServiceCard } from '@/components/ServiceCard/ServiceCard'
import { Button } from '@/components/ui/Button'
import { useEditorStore } from '@/stores/editorStore'
import { useUploadImage, useCreateTask, useTask } from '@/api/tasks'
import { useServices } from '@/api/services'

const CAR_COLORS = [
  { name: 'Красный',     en: 'bright red',              hex: '#ef4444' },
  { name: 'Синий',       en: 'bright blue',             hex: '#3b82f6' },
  { name: 'Зелёный',     en: 'bright green',            hex: '#22c55e' },
  { name: 'Жёлтый',      en: 'yellow',                  hex: '#eab308' },
  { name: 'Оранжевый',   en: 'orange',                  hex: '#f97316' },
  { name: 'Фиолетовый',  en: 'deep purple',             hex: '#a855f7' },
  { name: 'Розовый',     en: 'hot pink',                hex: '#ec4899' },
  { name: 'Белый',       en: 'pearl white',             hex: '#f1f5f9' },
  { name: 'Чёрный',      en: 'matte black',             hex: '#1e1e2e' },
  { name: 'Серебряный',  en: 'silver metallic',         hex: '#94a3b8' },
  { name: 'Золотой',     en: 'golden metallic',         hex: '#ca8a04' },
  { name: 'Тёмно-синий', en: 'dark navy blue',          hex: '#1e3a8a' },
]

/** Convert hex (#rrggbb) to approximate human-readable color name for the AI prompt */
function hexToColorDesc(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const rN = r / 255, gN = g / 255, bN = b / 255
  const max = Math.max(rN, gN, bN)
  const min = Math.min(rN, gN, bN)
  const l = (max + min) / 2
  if (max - min < 0.08) {
    if (l < 0.15) return 'matte black'
    if (l > 0.85) return 'pearl white'
    return 'gray'
  }
  const s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
  let h = 0
  if (max === rN) h = ((gN - bN) / (max - min) + 6) % 6
  else if (max === gN) h = (bN - rN) / (max - min) + 2
  else h = (rN - gN) / (max - min) + 4
  h = h * 60
  if (s < 0.15) return l < 0.4 ? 'dark gray' : 'light gray'
  const light = l < 0.28 ? 'dark ' : l > 0.72 ? 'light ' : ''
  if (h < 15)  return `${light}red`
  if (h < 45)  return `${light}orange`
  if (h < 75)  return `${light}yellow`
  if (h < 150) return `${light}green`
  if (h < 195) return `${light}cyan`
  if (h < 255) return `${light}blue`
  if (h < 315) return `${light}purple`
  return `${light}red`
}

function buildColorPrompt(colorEn: string): string {
  return `Repaint the car body to solid ${colorEn} color. Keep the background, wheels, windows, and lighting exactly the same.`
}

export const EditorWorkspace = () => {
  const {
    selectedService,
    uploadedImageUrl,
    uploadedImageFile,
    params,
    updateParam,
    setUploadedImage,
    setCurrentTask,
    setSelectedService,
    setParams,
  } = useEditorStore()

  const [taskId, setTaskId] = useState<string | null>(null)
  const [bgImageFile, setBgImageFile] = useState<File | null>(null)
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null)
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const { data: services } = useServices()
  const uploadMutation = useUploadImage()
  const createTaskMutation = useCreateTask()
  const { data: task } = useTask(taskId)

  const handleRun = async () => {
    if (!uploadedImageFile || !selectedService) return

    // Clear previous task before starting so errors/results don't leak across runs
    setTaskId(null)
    setCurrentTask(null)

    try {
      const { url } = await uploadMutation.mutateAsync(uploadedImageFile)

      let bgUrl: string | undefined
      if (selectedService.slug === 'background-replace' && bgImageFile) {
        const bgUpload = await uploadMutation.mutateAsync(bgImageFile)
        bgUrl = bgUpload.url
      }

      const newTask = await createTaskMutation.mutateAsync({
        service_id: selectedService.id,
        input_image_url: url,
        params: { ...params, ...(bgUrl ? { background_image_url: bgUrl } : {}) },
      })
      setCurrentTask(newTask)
      setTaskId(newTask.id)
    } catch (e) {
      console.error(e)
    }
  }

  // "Новая задача": keep service, only clear image + task + color
  const handleReset = () => {
    setTaskId(null)
    setCurrentTask(null)
    setUploadedImage(null, null)
    setBgImageFile(null)
    setBgImageUrl(null)
    setSelectedColorHex(null)
    setParams({})
  }


  const isRunning = task?.status === 'pending' || task?.status === 'processing'
  const isCompleted = task?.status === 'completed'

  const prevStatusRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!task) return
    const prev = prevStatusRef.current
    prevStatusRef.current = task.status
    if (prev === 'processing' || prev === 'pending') {
      if (task.status === 'completed') {
        toast.success('Готово! Изображение обработано', {
          description: 'Результат доступен в правой панели',
          duration: 5000,
        })
      } else if (task.status === 'failed') {
        toast.error('Ошибка обработки', {
          description: task.error_msg ?? 'Попробуй ещё раз',
          duration: 6000,
        })
      }
    }
  }, [task?.status])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* LEFT: Controls */}
      <div className="space-y-5">
        {/* Service selection */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-syne font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-violet-400">01.</span> Выберите сервис
          </h3>
          {selectedService ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <span className="text-2xl">{selectedService.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{selectedService.name}</p>
                <p className="text-xs text-white/40">{selectedService.category}</p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Сменить
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {services?.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  compact
                  onClick={() => setSelectedService(s)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Image upload */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-syne font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-violet-400">02.</span> Загрузите изображение
          </h3>
          <ImageUploader
            onImageSelect={(file, url) => setUploadedImage(url, file)}
            onClear={() => setUploadedImage(null, null)}
            currentImage={uploadedImageUrl}
            disabled={isRunning}
          />
        </div>

        {/* Background image uploader for background-replace */}
        {selectedService?.slug === 'background-replace' && (
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-syne font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-violet-400">03.</span> Загрузите фоновое изображение
            </h3>
            <ImageUploader
              onImageSelect={(file, url) => { setBgImageFile(file); setBgImageUrl(url) }}
              onClear={() => { setBgImageFile(null); setBgImageUrl(null) }}
              currentImage={bgImageUrl}
              disabled={isRunning}
            />
          </div>
        )}

        {/* Color picker for car-recolor */}
        {selectedService?.slug === 'car-recolor' && (
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-syne font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-violet-400">03.</span> Выберите цвет
            </h3>

            <div className="grid grid-cols-6 gap-2">
              {CAR_COLORS.map((color) => {
                const isSelected = selectedColorHex === color.hex
                return (
                  <button
                    key={color.hex}
                    disabled={isRunning}
                    title={color.name}
                    onClick={() => {
                      setSelectedColorHex(color.hex)
                      updateParam('prompt', buildColorPrompt(color.en))
                    }}
                    className="relative group flex flex-col items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span
                      className="w-9 h-9 rounded-xl block transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: color.hex,
                        outline: isSelected ? '2px solid #a78bfa' : '2px solid transparent',
                        outlineOffset: '2px',
                        boxShadow: color.hex === '#f1f5f9' ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : undefined,
                      }}
                    />
                    <span className="text-[10px] text-white/40 leading-none">{color.name}</span>
                  </button>
                )
              })}

              {/* Custom color */}
              <button
                disabled={isRunning}
                title="Свой цвет"
                onClick={() => colorInputRef.current?.click()}
                className="relative group flex flex-col items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border border-white/20"
                  style={{
                    background: selectedColorHex && !CAR_COLORS.find(c => c.hex === selectedColorHex)
                      ? selectedColorHex
                      : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                    outline: selectedColorHex && !CAR_COLORS.find(c => c.hex === selectedColorHex) ? '2px solid #a78bfa' : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                >
                  {(!selectedColorHex || CAR_COLORS.find(c => c.hex === selectedColorHex)) && (
                    <Pipette size={14} className="text-white drop-shadow" />
                  )}
                </span>
                <span className="text-[10px] text-white/40 leading-none">Свой</span>
                <input
                  ref={colorInputRef}
                  type="color"
                  className="sr-only"
                  onChange={(e) => {
                    const hex = e.target.value
                    setSelectedColorHex(hex)
                    updateParam('prompt', buildColorPrompt(hexToColorDesc(hex)))
                  }}
                />
              </button>
            </div>

            {selectedColorHex && (
              <p className="text-xs text-white/30 mt-3 flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: selectedColorHex }}
                />
                {CAR_COLORS.find(c => c.hex === selectedColorHex)?.name ?? selectedColorHex}
              </p>
            )}
          </div>
        )}

        {/* Run button */}
        <Button
          size="lg"
          className="w-full gap-2"
          disabled={!selectedService || !uploadedImageUrl || isRunning || (selectedService?.slug === 'background-replace' && !bgImageUrl)}
          loading={uploadMutation.isPending || createTaskMutation.isPending}
          onClick={handleRun}
        >
          <Sparkles size={18} />
          {isRunning ? 'Обрабатывается...' : 'Запустить AI'}
          {!isRunning && <ChevronRight size={16} />}
        </Button>

        {(uploadMutation.error || createTaskMutation.error) && !taskId && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            {(uploadMutation.error as { response?: { data?: { detail?: string } } } | null)?.response?.data?.detail
              ?? (createTaskMutation.error as { response?: { data?: { detail?: string } } } | null)?.response?.data?.detail
              ?? 'Ошибка при отправке запроса'}
          </p>
        )}

        {task && !isCompleted && (
          <>
            {task.status === 'failed' && (
              <div className="flex items-center justify-between">
                {task.error_msg && (
                  <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 flex-1 mr-3 truncate">
                    {task.error_msg}
                  </p>
                )}
                <button
                  onClick={() => { setTaskId(null); setCurrentTask(null) }}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
                >
                  Попробовать снова
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* RIGHT: Result */}
      <AnimatePresence>
        <div className="space-y-5">
          {task?.status === 'failed' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-5 aspect-square flex flex-col items-center justify-center gap-4 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <span className="text-4xl">❌</span>
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium">Ошибка обработки</p>
                <p className="text-white/30 text-xs mt-1">Проверьте, запущен ли ComfyUI</p>
              </div>
            </motion.div>
        ) : isCompleted && task?.output_image_url && task.input_image_url ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-semibold text-white flex items-center gap-2">
                  <span className="text-green-400">✓</span> Результат
                </h3>
                <button
                  onClick={handleReset}
                  className="text-xs text-white/40 hover:text-violet-400 transition-colors"
                >
                  Новая задача
                </button>
              </div>
              <ResultViewer
                originalUrl={task.input_image_url}
                resultUrl={task.output_image_url}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-5 aspect-square flex flex-col items-center justify-center gap-4 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                {isRunning ? (
                  <span className="text-violet-300 font-mono font-bold text-2xl">
                    {task?.progress ?? 0}%
                  </span>
                ) : (
                  <Sparkles size={36} className="text-violet-400/50" />
                )}
              </div>
              <div>
                {isRunning ? (
                  <>
                    <p className="text-violet-300/70 text-sm font-medium">Обрабатывается...</p>
                    <div className="mt-2 w-32 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
                      <motion.div
                        className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full"
                        animate={{ width: `${task?.progress ?? 0}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-white/40 text-sm">Результат появится здесь</p>
                    <p className="text-white/20 text-xs mt-1">после обработки</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>
    </div>
  )
}
