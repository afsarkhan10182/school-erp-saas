import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, PaginatedResponse } from '~/types';
import { useAuthStore } from '~/stores/auth';

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
            if (window.location.pathname !== '/login') {
              await authStore.logout();
              await navigateTo('/login');
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

// Export createApiInstance as default for backward compatibility
export default createApiInstance;
