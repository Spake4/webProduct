import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  Wand2,
  Images,
  User,
  Zap,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { to: '/', icon: Home, label: 'Главная' },
  { to: '/editor', icon: Wand2, label: 'Редактор' },
  { to: '/gallery', icon: Images, label: 'Галерея' },
  { to: '/profile', icon: User, label: 'Профиль' },
]

export const Sidebar = () => {
  const { user, logout, isAuthenticated } = useAuthStore()

  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className="fixed left-0 top-0 h-full w-[72px] lg:w-56 bg-[#0b0b11]/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-50"
    >
      {/* subtle vertical glow accent on the right edge */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-violet-500/40 to-transparent" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-glow animate-glow-pulse">
          <Zap size={18} className="text-white" />
        </div>
        <span className="hidden lg:block font-syne font-bold text-white text-base tracking-tight">
          AI<span className="gradient-text">Edit</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'text-violet-300'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-violet-600/20 border border-violet-500/30 shadow-[0_0_18px_rgba(124,58,237,0.35)]"
                  />
                )}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-violet-400 to-blue-400" />
                )}
                <Icon size={20} className="relative z-10 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span className="relative z-10 hidden lg:block text-sm font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-2 py-4 border-t border-white/5">
        {isAuthenticated && user ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ring-2 ring-violet-500/20">
                {user.email[0].toUpperCase()}
              </div>
              <div className="hidden lg:flex flex-col min-w-0">
                <span className="text-xs font-medium text-white/80 truncate">{user.email}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut size={18} className="flex-shrink-0" />
              <span className="hidden lg:block text-sm">Выйти</span>
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-violet-400 hover:bg-violet-500/10 transition-all duration-200"
          >
            <User size={20} />
            <span className="hidden lg:block text-sm font-medium">Войти</span>
          </NavLink>
        )}
      </div>
    </motion.aside>
  )
}
