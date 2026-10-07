import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '~/stores/auth';

let staleSessionRedirecting = false;

export function createApiInstance(): AxiosInstance {
  const config = useRuntimeConfig();
  const apiBase = config.public?.apiBase;

  const api: AxiosInstance = axios.create({
    baseURL: apiBase,
    timeout: 10000,
    withCredentials: true, // Include cookies with requests
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0'
    }
  });

  // Request interceptor - no need to manually add tokens since they're in secure cookies
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Ensure config exists and has required properties
      if (!config) {
        throw new Error('Request configuration is undefined');
      }
      return config;
    },
    (error: any) => Promise.reject(error)
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async error => {
      const originalRequest = error.config;

      // Safety check for originalRequest
      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Don't attempt token refresh for auth endpoints (login, logout, refresh)
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/logout') ||
        originalRequest.url?.includes('/auth/refresh-token');

      // Don't attempt token refresh for /auth/me endpoint (prevents logout loops)
      const isMeEndpoint = originalRequest.url?.includes('/auth/me');

      // A demo reseed replaces the school UUID. Force a clean login instead of
      // leaving the UI on a stale session that renders empty data.
      if (
        error.response?.status === 404 &&
        /school not found/i.test(error.response?.data?.message || '') &&
        !isAuthEndpoint &&
        import.meta.client &&
        window.location.pathname !== '/auth/login'
      ) {
        if (!staleSessionRedirecting) {
          staleSessionRedirecting = true;
          const authStore = useAuthStore();
          authStore.user.value = null;
          authStore.currentBranch.value = null;
          authStore.currentSchool.value = null;
          authStore.availableBranches.value = [];
          authStore.clearAuthData();
          window.location.replace('/auth/login');
        }
      }

      // Handle 401 errors with automatic token refresh (only for non-auth endpoints)
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isAuthEndpoint &&
        !isMeEndpoint
      ) {
        originalRequest._retry = true;

        try {
          // Call refresh endpoint to get new tokens
          const refreshResponse = await api.post('/auth/refresh-token');

          if (refreshResponse.status === 200) {
            // Retry the original request with new tokens (cookies are automatically included)
            return api(originalRequest);
          }
        } catch (refreshError: any) {
          // If refresh failed, logout and redirect (but only once)
          if (import.meta.client) {
            const authStore = useAuthStore();
            // Only logout if not already on login page
            if (window.location.pathname !== '/auth/login') {
              await authStore.logout();
              await navigateTo('/auth/login');
            }
          }
        }

        return Promise.reject(new Error('Authentication required'));
      }

      // For auth endpoints with 401, just reject the error without attempting refresh
      if (error.response?.status === 401 && (isAuthEndpoint || isMeEndpoint)) {
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );

  return api;
}

/**
 * Generic API call helper
 * Reduces boilerplate in API service files
 */
export const apiCall = async (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  endpoint: string,
  data?: any
) => {
  const api = createApiInstance();
  try {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      delete api.defaults.headers.common['Content-Type'];
      delete api.defaults.headers.post['Content-Type'];
      delete api.defaults.headers.put['Content-Type'];
      delete api.defaults.headers.patch['Content-Type'];
    }
    const response =
      method === 'get' || method === 'delete'
        ? await api[method](endpoint, data)
        : await api[method](endpoint, data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Request failed';
    const err = new Error(message) as any;
    err.response = error?.response;
    err.status = error?.response?.status;
    throw err;
  }
};
