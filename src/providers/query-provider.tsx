"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,        // 5 minutes — most data is stable
            gcTime: 10 * 60 * 1000,           // keep unused data 10 min before GC
            refetchOnWindowFocus: false,       // prevent surprise refetches on tab switch
            retry: 1,                          // single retry on failure
          },
        },
      })
  )
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
