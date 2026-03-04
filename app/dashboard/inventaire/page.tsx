'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import InventaireLayout from '@/app/components/inventaire/InventaireLayout'

const queryClient = new QueryClient()

export default function InventairePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <InventaireLayout />
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}