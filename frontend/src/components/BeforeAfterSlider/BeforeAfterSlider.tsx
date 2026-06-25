import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface BeforeAfterSliderProps {
  before: string
  after: string
  className?: string
  objectPosition?: string
}

export const BeforeAfterSlider = ({ before, after, className, objectPosition = "center" }: BeforeAfterSliderProps) => {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100))
    setPosition(pct)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    e.stopPropagation()
    updatePosition(e.clientX)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation()
    dragging.current = false
  }
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden select-none cursor-col-resize', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
    >
      {/* After image — full */}
      <img src={after} alt="после" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition }} draggable={false} />

      {/* Before image — clipped to left side */}
      <img
        src={before}
        alt="до"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)`, objectPosition }}
        draggable={false}
      />

      {/* Divider line */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.6)] pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle circle */}
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center gap-[3px]">
          <div className="w-px h-3 bg-gray-400 rounded-full" />
          <div className="w-px h-3 bg-gray-400 rounded-full" />
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-black/55 text-white/80 px-1.5 py-0.5 rounded pointer-events-none">
        До
      </span>
      <span className="absolute bottom-2 right-2 text-[10px] font-medium bg-black/55 text-white/80 px-1.5 py-0.5 rounded pointer-events-none">
        После
      </span>
    </div>
  )
}
