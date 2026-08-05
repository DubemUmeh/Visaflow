'use client';
import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { createQueryClient } from '../lib/query-client';
import { AuthInitializer } from './auth-initializer';
import { useAuthStore } from '../store/auth.store';
import { AppKitProvider } from '@/lib/appkit-provider';

/**
 * Waits for Zustand's persist middleware to finish reading from sessionStorage
 * before rendering anything. Uses the official persist API instead of a custom
 * flag — this is reliable regardless of whether storage is sync or async.
 *
 * - persist.hasHydrated()       → true if already done before this mounts
 * - persist.onFinishHydration() → fires if hydration is still in progress
 */
function AuthHydrationGate({ children }: { children: React.ReactNode }) {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // sessionStorage is synchronous, so hydration may already be complete by
    // the time this effect runs. Check first to avoid a needless extra render.
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }

    // Fallback for async storage or any edge case where hydration is still
    // in progress when the component mounts.
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return unsub;
  }, []);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthInitializer />
        <AuthHydrationGate>
          <AppKitProvider>
            {children}
          </AppKitProvider>
        </AuthHydrationGate>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}