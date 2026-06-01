import axios, { type AxiosInstance, type AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let accessToken: string | null = null;
let refreshToken: string | null = null;
const tokenListeners = new Set<
  (tokens: { accessToken: string | null; refreshToken: string | null }) => void
>();

function notifyTokenListeners() {
  for (const listener of tokenListeners) {
    listener({ accessToken, refreshToken });
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setAuthTokens(
  nextAccessToken: string | null,
  nextRefreshToken: string | null,
) {
  accessToken = nextAccessToken;
  refreshToken = nextRefreshToken;
  notifyTokenListeners();
}

export function onAuthTokensChanged(
  listener: (tokens: { accessToken: string | null; refreshToken: string | null }) => void,
) {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach auth token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle 401 — attempt silent refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!refreshToken) {
        setAuthTokens(null, null);
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );
        const newAccessToken = data?.data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken ?? refreshToken;
        if (newAccessToken) {
          setAuthTokens(newAccessToken, newRefreshToken);
          processQueue(null, newAccessToken);
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAuthTokens(null, null);
        if (typeof window !== 'undefined') window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
