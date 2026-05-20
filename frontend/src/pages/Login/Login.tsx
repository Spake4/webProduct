import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLogin, useRegister } from '@/api/auth'

export const Login = () => {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const registerMutation = useRegister()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isRegister) {
        await registerMutation.mutateAsync(form)
      } else {
        await loginMutation.mutateAsync({ email: form.email, password: form.password })
      }
      navigate('/')
    } catch (_) {
      // errors handled by mutation
    }
  }

  const mutation = isRegister ? registerMutation : loginMutation
  const error = mutation.error as { response?: { data?: { detail?: string } } } | null

  return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-syne font-bold text-xl text-white">
            AI<span className="gradient-text">Edit</span>
          </span>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h1 className="font-syne font-bold text-xl text-white text-center mb-1">
            {isRegister ? 'Создать аккаунт' : 'Войти'}
          </h1>
          <p className="text-white/40 text-sm text-center mb-6">
            {isRegister ? 'Заполните данные для регистрации' : 'Введите ваши данные'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            {isRegister && (
              <Input
                label="Имя пользователя"
                placeholder="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            )}

            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {error?.response?.data?.detail && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                {error.response.data.detail}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={mutation.isPending}
            >
              {isRegister ? 'Зарегистрироваться' : 'Войти'}
            </Button>
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            {isRegister ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              {isRegister ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-white/20 mt-4">
          <Link to="/" className="hover:text-white/40 transition-colors">
            ← На главную
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
