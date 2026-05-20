import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { Task } from '@/types'

interface CreateTaskPayload {
  service_id: string
  input_image_url: string
  params: Record<string, unknown>
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload): Promise<Task> => {
      const { data } = await apiClient.post('/tasks/create', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export const useTask = (taskId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: async (): Promise<Task> => {
      const { data } = await apiClient.get(`/tasks/${taskId}`)
      return data
    },
    enabled: !!taskId && enabled,
    refetchInterval: (query) => {
      const task = query.state.data
      if (!task) return 2000  // poll even before first response arrives
      if (task.status === 'pending' || task.status === 'processing') return 2000
      return false
    },
    refetchIntervalInBackground: true,  // keep polling even when tab is not focused
    staleTime: 0,                        // never treat task data as fresh
    gcTime: 0,                           // don't cache completed/failed tasks
    retry: 1,                            // retry once on network error, then continue polling
  })
}

export const useUserTasks = (page = 1) => {
  return useQuery({
    queryKey: ['tasks', 'user', page],
    queryFn: async (): Promise<{ items: Task[]; total: number }> => {
      const { data } = await apiClient.get('/tasks', { params: { page, per_page: 20 } })
      return data
    },
  })
}

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
  })
}
