import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import type { User, AuthTokens } from '@/types'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  username: string
  password: string
}

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (payload: LoginPayload): Promise<{ user: User; tokens: AuthTokens }> => {
      const { data } = await apiClient.post('/auth/login', payload)
      return data
    },
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens.access_token)
    },
  })
}

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (payload: RegisterPayload): Promise<{ user: User; tokens: AuthTokens }> => {
      const { data } = await apiClient.post('/auth/register', payload)
      return data
    },
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens.access_token)
    },
  })
}
