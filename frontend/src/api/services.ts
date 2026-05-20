import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { Service } from '@/types'

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async (): Promise<Service[]> => {
      const { data } = await apiClient.get('/services')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useService = (slug: string) => {
  return useQuery({
    queryKey: ['services', slug],
    queryFn: async (): Promise<Service> => {
      const { data } = await apiClient.get(`/services/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}
