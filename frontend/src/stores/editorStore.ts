import { create } from 'zustand'
import type { Service, Task } from '@/types'

interface EditorState {
  selectedService: Service | null
  uploadedImageUrl: string | null
  uploadedImageFile: File | null
  currentTask: Task | null
  params: Record<string, unknown>
  setSelectedService: (service: Service | null) => void
  setUploadedImage: (url: string | null, file: File | null) => void
  setCurrentTask: (task: Task | null) => void
  setParams: (params: Record<string, unknown>) => void
  updateParam: (key: string, value: unknown) => void
  reset: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedService: null,
  uploadedImageUrl: null,
  uploadedImageFile: null,
  currentTask: null,
  params: {},

  setSelectedService: (service) => set({ selectedService: service, params: {} }),
  setUploadedImage: (url, file) => set({ uploadedImageUrl: url, uploadedImageFile: file }),
  setCurrentTask: (task) => set({ currentTask: task }),
  setParams: (params) => set({ params }),
  updateParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),
  reset: () => set({
    selectedService: null,
    uploadedImageUrl: null,
    uploadedImageFile: null,
    currentTask: null,
    params: {},
  }),
}))
