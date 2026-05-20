import { motion } from 'framer-motion'
import { EditorWorkspace } from '@/components/EditorWorkspace/EditorWorkspace'

export const Editor = () => {
  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-syne font-bold text-2xl text-white">Редактор</h1>
        <p className="text-white/40 text-sm mt-1">Выберите сервис, загрузите изображение и запустите AI</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <EditorWorkspace />
      </motion.div>
    </div>
  )
}
