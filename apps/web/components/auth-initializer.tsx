'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';

/**
 * Initializes auth state on app load by restoring session tokens.
 * This component should be placed in the root layout to ensure it runs early
 */
export function AuthInitializer() {
  useEffect(() => {
    // The Zustand persist middleware rehydrates from sessionStorage.
    // User profile data stays in memory and is fetched fresh after a reload.
    const authState = useAuthStore.getState();
    
    if (authState.isAuthenticated && authState.accessToken && !authState.user) {
      void authState.refreshUser();
    }
  }, []);

  return null;
}
