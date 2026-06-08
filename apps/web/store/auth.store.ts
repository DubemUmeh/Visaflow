"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { UserEntity } from "@visaflow/shared-types";
import api, {
  onAuthTokensChanged,
  setAccessToken,
  setRefreshToken,
} from "../lib/api";
import { useApplicationWizardStore } from "./application.store";

interface AuthState {
  user: UserEntity | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserEntity, token: string, refreshToken?: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer((set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password, rememberMe = false) => {
        set((s) => {
          s.isLoading = true;
          s.error = null;
        });
        try {
          const { data } = await api.post("/auth/login", {
            email,
            password,
            rememberMe,
          });
          const { accessToken, refreshToken, user } = data.data;
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);
          useApplicationWizardStore.getState().reset();
          useApplicationWizardStore.getState().setOwnerUserId(user.id);
          set((s) => {
            s.user = user;
            s.accessToken = accessToken;
            s.refreshToken = refreshToken;
            s.isAuthenticated = true;
            s.isLoading = false;
          });
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Login failed";
          set((s) => {
            s.error = Array.isArray(msg) ? msg[0] : msg;
            s.isLoading = false;
          });
          throw err;
        }
      },

      register: async (payload) => {
        set((s) => {
          s.isLoading = true;
          s.error = null;
        });
        try {
          const { data } = await api.post("/auth/register", payload);
          const { accessToken, refreshToken, user } = data.data;
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);
          useApplicationWizardStore.getState().reset();
          useApplicationWizardStore.getState().setOwnerUserId(user.id);
          set((s) => {
            s.user = user;
            s.accessToken = accessToken;
            s.refreshToken = refreshToken;
            s.isAuthenticated = true;
            s.isLoading = false;
          });
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Registration failed";
          set((s) => {
            s.error = Array.isArray(msg) ? msg[0] : msg;
            s.isLoading = false;
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          const refreshToken = get().refreshToken;
          await api.post("/auth/logout", refreshToken ? { refreshToken } : {});
        } catch (e) {
          console.error(e);
        }
        setAccessToken(null);
        setRefreshToken(null);
        useApplicationWizardStore.getState().reset();
        set((s) => {
          s.user = null;
          s.accessToken = null;
          s.refreshToken = null;
          s.isAuthenticated = false;
        });
      },

      refreshUser: async () => {
        if (!get().accessToken) return;
        try {
          const { data } = await api.get("/users/me");
          const user = data.data;
          const wizard = useApplicationWizardStore.getState();
          if (wizard.ownerUserId && wizard.ownerUserId !== user.id) {
            wizard.reset();
          }
          useApplicationWizardStore.getState().setOwnerUserId(user.id);
          set((s) => {
            s.user = user;
          });
        } catch (e) {
          console.error(e);
        }
      },

      setUser: (user, token, refreshToken) => {
        useApplicationWizardStore.getState().reset();
        useApplicationWizardStore.getState().setOwnerUserId(user.id);
        setAccessToken(token);
        if (refreshToken) setRefreshToken(refreshToken);
        set((s) => {
          s.user = user;
          s.accessToken = token;
          s.refreshToken = refreshToken ?? null;
          s.isAuthenticated = true;
        });
      },

      clearError: () =>
        set((s) => {
          s.error = null;
        }),
    })),
    {
      name: "visaflow-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
      // Restore tokens on the axios instance so the first API call after a
      // page reload already has the Authorization header attached.
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAccessToken(state.accessToken);
        if (state?.refreshToken) setRefreshToken(state.refreshToken);
      },
    },
  ),
);

onAuthTokensChanged(({ accessToken, refreshToken }) => {
  useAuthStore.setState((state) => ({
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken && refreshToken),
    user: accessToken ? state.user : null,
  }));
});
