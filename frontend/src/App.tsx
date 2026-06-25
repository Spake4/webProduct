import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Layout } from '@/components/Layout/Layout'
import { Home } from '@/pages/Home/Home'
import { Editor } from '@/pages/Editor/Editor'
import { Gallery } from '@/pages/Gallery/Gallery'
import { Profile } from '@/pages/Profile/Profile'
import { Login } from '@/pages/Login/Login'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Главная — публичная */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
          </Route>

          {/* Остальные — только авторизованным */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/editor" element={<Editor />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
        richColors
      />
    </QueryClientProvider>
  )
}

export default App
