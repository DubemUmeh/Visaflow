'use client';
import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { createQueryClient } from '../lib/query-client';
import { AuthInitializer } from './auth-initializer';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthInitializer />
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
