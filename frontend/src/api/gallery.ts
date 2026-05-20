import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { GalleryItem, PaginatedResponse } from '@/types'

export const useGallery = (page = 1) => {
  return useQuery({
    queryKey: ['gallery', page],
    queryFn: async (): Promise<PaginatedResponse<GalleryItem>> => {
      const { data } = await apiClient.get('/gallery', { params: { page, per_page: 20 } })
      return data
    },
  })
}

export const useLikeItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      await apiClient.post(`/gallery/${itemId}/like`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}
