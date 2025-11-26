import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import AppRoutes from './routes/AppRouter.tsx'
import { BrowserRouter } from 'react-router-dom'
import { PageLayout } from './layout/PageLayout.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <PageLayout>
          <AppRoutes />
        </PageLayout>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
)
