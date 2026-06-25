export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  created_at: string
}

export interface Service {
  id: string
  name: string
  slug: string
  description: string
  category: ServiceCategory
  icon: string
  is_active: boolean
  preview_url?: string
}

export type ServiceCategory = 'auto' | 'logos' | 'clothing' | 'interior' | 'portrait' | 'stylization' | 'utilities'

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Task {
  id: string
  user_id: string
  service_id: string
  service?: Service
  status: TaskStatus
  progress: number
  input_image_url: string
  output_image_url?: string
  params: Record<string, unknown>
  created_at: string
  completed_at?: string
  error_msg?: string
}

export interface GalleryItem {
  id: string
  task_id: string
  user_id: string
  task?: Task
  service?: Service
  output_image_url: string
  likes_count: number
  is_public: boolean
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export interface AuthTokens {
  access_token: string
  token_type: string
}
