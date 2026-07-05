import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - garbage collection time
      refetchOnWindowFocus: false, // don't refetch on tab focus
      retry: 2,
    },
  },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => queryClient)

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  )
}
