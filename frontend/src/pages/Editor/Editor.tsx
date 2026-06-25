import { motion } from 'framer-motion'
import { EditorWorkspace } from '@/components/EditorWorkspace/EditorWorkspace'

export const Editor = () => {
  return (
    <div className="min-h-screen p-6 pt-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <span className="text-xs font-semibold tracking-[0.25em] text-violet-400 uppercase">Workspace</span>
        <h1 className="font-syne font-bold text-3xl lg:text-4xl text-white mt-1.5">
          AI <span className="gradient-text">Редактор</span>
        </h1>
        <p className="text-white/40 text-sm mt-2">Выберите сервис, загрузите изображение и запустите AI</p>
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
