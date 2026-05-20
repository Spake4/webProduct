import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  onImageSelect: (file: File, previewUrl: string) => void
  onClear?: () => void
  currentImage?: string | null
  disabled?: boolean
  className?: string
}

export const ImageUploader = ({
  onImageSelect,
  onClear,
  currentImage,
  disabled,
  className,
}: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      onImageSelect(file, url)
    },
    [onImageSelect]
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {currentImage ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden bg-[#16161f] group"
          >
            <img
              src={currentImage}
              alt="Загруженное изображение"
              className="w-full max-h-72 object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClear?.()
                }}
                className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                'aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4',
                'cursor-pointer transition-all duration-300',
                isDragging
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-white/10 bg-[#16161f] hover:border-violet-500/50 hover:bg-violet-500/5',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...getInputProps()} />
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                isDragging ? 'bg-violet-500/30' : 'bg-white/5'
              )}>
                {isDragging ? (
                  <ImageIcon size={28} className="text-violet-400" />
                ) : (
                  <Upload size={28} className="text-white/30" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-white/60 font-medium">
                  {isDragging ? 'Отпустите для загрузки' : 'Перетащите изображение'}
                </p>
                <p className="text-xs text-white/30 mt-1">или кликните для выбора</p>
                <p className="text-xs text-white/20 mt-1">JPG, PNG, WEBP</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
