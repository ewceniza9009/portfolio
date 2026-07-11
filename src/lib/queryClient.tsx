import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState } from 'react'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'portfolio-cache',
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => queryClient)

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: 30 * 60 * 1000,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            if (query.state.status !== 'success') return false
            const key = query.queryKey[0] as string
            const adminEditable = ['about', 'experience', 'skills', 'projects', 'awards']
            return !adminEditable.includes(key)
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
