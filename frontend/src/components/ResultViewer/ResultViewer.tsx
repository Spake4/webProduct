import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ResultViewerProps {
  originalUrl: string
  resultUrl: string
  className?: string
}

export const ResultViewer = ({ originalUrl, resultUrl, className }: ResultViewerProps) => {
  const [sliderPos, setSliderPos] = useState(50)
  const [mode, setMode] = useState<'split' | 'before' | 'after'>('split')
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleMouseDown = () => { isDragging.current = true }
  const handleMouseUp = () => { isDragging.current = false }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pos = ((e.clientX - rect.left) / rect.width) * 100
    setSliderPos(Math.max(5, Math.min(95, pos)))
  }

  const handleDownload = async () => {
    const link = document.createElement('a')
    link.href = resultUrl
    link.download = `ai-result-${Date.now()}.png`
    link.click()
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Mode tabs */}
      <div className="flex gap-2">
        {(['split', 'before', 'after'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              mode === m
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
            )}
          >
            {m === 'split' ? 'Сравнение' : m === 'before' ? 'До' : 'После'}
          </button>
        ))}
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        className="relative aspect-square rounded-2xl overflow-hidden bg-[#16161f] cursor-col-resize select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {mode === 'before' && (
          <img src={originalUrl} alt="Оригинал" className="w-full h-full object-cover" />
        )}
        {mode === 'after' && (
          <img src={resultUrl} alt="Результат" className="w-full h-full object-cover" />
        )}
        {mode === 'split' && (
          <>
            {/* Original */}
            <img src={originalUrl} alt="Оригинал" className="w-full h-full object-cover absolute inset-0" />
            {/* Result clipped */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
            >
              <img src={resultUrl} alt="Результат" className="w-full h-full object-cover" />
            </div>
            {/* Divider */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg cursor-col-resize"
              style={{ left: `${sliderPos}%` }}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                <ArrowLeftRight size={14} className="text-gray-800" />
              </div>
            </div>
            {/* Labels */}
            <div className="absolute top-3 left-3 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white/70">До</div>
            <div className="absolute top-3 right-3 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white/70">После</div>
          </>
        )}
      </div>

      {/* Download */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Button onClick={handleDownload} className="w-full gap-2">
          <Download size={16} />
          Скачать результат
        </Button>
      </motion.div>
    </div>
  )
}
