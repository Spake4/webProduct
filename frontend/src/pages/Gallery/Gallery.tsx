import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Download } from 'lucide-react'
import { useGallery, useLikeItem } from '@/api/gallery'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export const Gallery = () => {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGallery(page)
  const likeMutation = useLikeItem()

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-syne font-bold text-2xl text-white">Галерея</h1>
        <p className="text-white/40 text-sm mt-1">Работы пользователей платформы</p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data?.items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-[#16161f]"
              >
                <img
                  src={item.output_image_url}
                  alt="Gallery item"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs text-white/70 bg-black/40 rounded-full px-2 py-1">
                      {item.service?.name ?? 'AI Edit'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => likeMutation.mutate(item.id)}
                        className={cn(
                          'flex items-center gap-1 bg-black/40 rounded-full px-2 py-1',
                          'hover:bg-red-500/40 transition-colors'
                        )}
                      >
                        <Heart size={12} className="text-red-400" />
                        <span className="text-xs text-white/70">{item.likes_count}</span>
                      </button>
                      <a
                        href={item.output_image_url}
                        download
                        className="flex items-center bg-black/40 rounded-full p-1 hover:bg-white/20 transition-colors"
                      >
                        <Download size={12} className="text-white/70" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total > data.per_page && (
            <div className="flex justify-center gap-3 mt-8">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Назад
              </Button>
              <span className="flex items-center text-sm text-white/40">
                {page} / {Math.ceil(data.total / data.per_page)}
              </span>
              <Button
                variant="secondary"
                disabled={page >= Math.ceil(data.total / data.per_page)}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
